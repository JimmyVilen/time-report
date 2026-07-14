using System.IO.Compression;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using TimeReport.Api.Data;
using TimeReport.Api.Services;

namespace TimeReport.Api.Controllers;

[Route("api/admin/database")]
public class DatabaseController(
    AppDbContext db,
    DatabaseSnapshotService snapshotService,
    IConfiguration configuration,
    IHostApplicationLifetime lifetime,
    ILogger<DatabaseController> logger) : ApiControllerBase
{
    private static readonly byte[] SqliteMagic = "SQLite format 3\0"u8.ToArray();

    [HttpGet("export")]
    public async Task<IActionResult> Export(CancellationToken ct)
    {
        if (!await IsCurrentUserAdminAsync(ct)) return Forbid();

        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss");
        var tempDbPath = Path.Combine(Path.GetTempPath(), $"timereport-export-{Guid.NewGuid()}.db");
        try
        {
            await snapshotService.CreateSnapshotAsync(tempDbPath, ct);

            using var zipStream = new MemoryStream();
            using (var archive = new ZipArchive(zipStream, ZipArchiveMode.Create, leaveOpen: true))
            {
                var entry = archive.CreateEntry($"timereport-{timestamp}.db", CompressionLevel.Optimal);
                using var entryStream = entry.Open();
                await using var fileStream = System.IO.File.OpenRead(tempDbPath);
                await fileStream.CopyToAsync(entryStream, ct);
            }

            return File(zipStream.ToArray(), "application/zip", $"timereport-export-{timestamp}.zip");
        }
        finally
        {
            if (System.IO.File.Exists(tempDbPath)) System.IO.File.Delete(tempDbPath);
        }
    }

    [HttpPost("import")]
    [RequestSizeLimit(200_000_000)]
    [RequestFormLimits(MultipartBodyLengthLimit = 200_000_000)]
    public async Task<IActionResult> Import(IFormFile file, CancellationToken ct)
    {
        if (!await IsCurrentUserAdminAsync(ct)) return Forbid();
        if (file.Length == 0) return BadRequest(new { error = "Ingen fil vald" });

        var stagingDir = Path.Combine(Path.GetTempPath(), $"timereport-import-{Guid.NewGuid()}");
        Directory.CreateDirectory(stagingDir);
        try
        {
            var uploadedPath = Path.Combine(stagingDir, "upload");
            await using (var uploadStream = System.IO.File.Create(uploadedPath))
                await file.CopyToAsync(uploadStream, ct);

            string candidateDbPath;
            var kind = await SniffFileKindAsync(uploadedPath, ct);
            switch (kind)
            {
                case FileKind.Zip:
                    var extracted = ExtractSingleDbEntry(uploadedPath, stagingDir);
                    if (extracted.Error != null) return BadRequest(new { error = extracted.Error });
                    candidateDbPath = extracted.Path!;
                    break;
                case FileKind.Sqlite:
                    candidateDbPath = uploadedPath;
                    break;
                default:
                    return BadRequest(new { error = "Filen känns inte igen som en zip- eller SQLite-databasfil" });
            }

            var (ok, error) = await ValidateSqliteFileAsync(candidateDbPath, ct);
            if (!ok) return BadRequest(new { error });

            var backupDir = configuration["Backup:Directory"] ?? "/app/backup";
            await snapshotService.CreateSnapshotAsync(
                Path.Combine(backupDir, DatabaseSnapshotService.GenerateSnapshotFileName("pre-import")), ct);

            var livePath = await snapshotService.GetLiveDatabasePathAsync(ct);
            await db.Database.CloseConnectionAsync();
            SqliteConnection.ClearAllPools();

            var swapPath = livePath + ".importing";
            System.IO.File.Copy(candidateDbPath, swapPath, overwrite: true);
            System.IO.File.Move(swapPath, livePath, overwrite: true);

            foreach (var suffix in new[] { "-wal", "-shm" })
            {
                try
                {
                    var sidecar = livePath + suffix;
                    if (System.IO.File.Exists(sidecar)) System.IO.File.Delete(sidecar);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to remove stale sidecar file after import");
                }
            }

            logger.LogInformation("Database imported; scheduling app restart");
            _ = Task.Run(async () =>
            {
                await Task.Delay(TimeSpan.FromSeconds(1));
                lifetime.StopApplication();
            }, CancellationToken.None);

            return Ok(new { message = "Databasen importerades. Appen startar om." });
        }
        finally
        {
            try { Directory.Delete(stagingDir, recursive: true); }
            catch (Exception ex) { logger.LogWarning(ex, "Failed to clean up import staging directory"); }
        }
    }

    private async Task<bool> IsCurrentUserAdminAsync(CancellationToken ct) =>
        await db.Users.AsNoTracking().Where(u => u.Id == CurrentUserId)
            .Select(u => u.IsAdmin).FirstOrDefaultAsync(ct);

    private enum FileKind { Unknown, Sqlite, Zip }

    private static async Task<FileKind> SniffFileKindAsync(string path, CancellationToken ct)
    {
        var header = new byte[Math.Max(SqliteMagic.Length, 4)];
        await using var stream = System.IO.File.OpenRead(path);
        var read = await stream.ReadAsync(header, ct);
        if (read >= SqliteMagic.Length && header.AsSpan(0, SqliteMagic.Length).SequenceEqual(SqliteMagic))
            return FileKind.Sqlite;
        if (read >= 4 && header[0] == 0x50 && header[1] == 0x4B && (header[2] == 0x03 || header[2] == 0x05))
            return FileKind.Zip;
        return FileKind.Unknown;
    }

    private static (string? Path, string? Error) ExtractSingleDbEntry(string zipPath, string destDir)
    {
        using var archive = ZipFile.OpenRead(zipPath);
        var dbEntries = archive.Entries
            .Where(e => e.FullName.EndsWith(".db", StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (dbEntries.Count != 1)
            return (null, $"Zip-filen måste innehålla exakt en .db-fil (hittade {dbEntries.Count})");

        var entry = dbEntries[0];
        var destPath = Path.GetFullPath(Path.Combine(destDir, Path.GetFileName(entry.FullName)));
        if (!destPath.StartsWith(Path.GetFullPath(destDir) + Path.DirectorySeparatorChar))
            return (null, "Ogiltig sökväg i zip-filen");

        entry.ExtractToFile(destPath, overwrite: true);
        return (destPath, null);
    }

    private async Task<(bool Ok, string? Error)> ValidateSqliteFileAsync(string path, CancellationToken ct)
    {
        if (await SniffFileKindAsync(path, ct) != FileKind.Sqlite)
            return (false, "Filen är inte en giltig SQLite-databas");

        await using var connection = new SqliteConnection($"Data Source={path};Mode=ReadOnly");
        try
        {
            await connection.OpenAsync(ct);

            await using (var integrityCmd = connection.CreateCommand())
            {
                integrityCmd.CommandText = "PRAGMA integrity_check;";
                var result = await integrityCmd.ExecuteScalarAsync(ct) as string;
                if (!string.Equals(result, "ok", StringComparison.OrdinalIgnoreCase))
                    return (false, "Databasfilen klarade inte integritetskontrollen");
            }

            await using (var tableCmd = connection.CreateCommand())
            {
                tableCmd.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name='users'";
                var result = await tableCmd.ExecuteScalarAsync(ct);
                if (result is null)
                    return (false, "Databasfilen ser inte ut att vara en TimeReport-databas");
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Uploaded database failed validation");
            return (false, "Kunde inte läsa databasfilen");
        }

        return (true, null);
    }
}
