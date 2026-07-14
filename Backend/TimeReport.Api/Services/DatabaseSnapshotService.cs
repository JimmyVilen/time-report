using Microsoft.EntityFrameworkCore;
using TimeReport.Api.Data;

namespace TimeReport.Api.Services;

/// <summary>
/// Produces safe, self-contained snapshots of the live SQLite database via VACUUM INTO -
/// works against a live WAL-mode connection and needs no follow-up -wal/-shm sidecars.
/// Shared by the periodic DatabaseBackupService, the pre-import safety backup, and export.
/// </summary>
public class DatabaseSnapshotService(AppDbContext db, ILogger<DatabaseSnapshotService> logger)
{
    public async Task CreateSnapshotAsync(string destinationPath, CancellationToken ct = default)
    {
        var directory = Path.GetDirectoryName(destinationPath);
        if (!string.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);

        await db.Database.OpenConnectionAsync(ct);
        try
        {
            var connection = db.Database.GetDbConnection();
            var cmd = connection.CreateCommand();
            await using (cmd.ConfigureAwait(false))
            {
                var param = cmd.CreateParameter();
                param.ParameterName = "$path";
                param.Value = destinationPath;
                cmd.Parameters.Add(param);
                cmd.CommandText = "VACUUM INTO $path";
                await cmd.ExecuteNonQueryAsync(ct);
            }
        }
        finally
        {
            await db.Database.CloseConnectionAsync();
        }

        logger.LogInformation("Database snapshot written to {Path}", destinationPath);
    }

    public static string GenerateSnapshotFileName(string prefix) =>
        $"{prefix}-{DateTime.UtcNow:yyyyMMdd-HHmmss}.db";

    /// <summary>
    /// Resolves the live database's absolute on-disk path by asking SQLite itself
    /// (PRAGMA database_list), rather than parsing the connection string - this correctly
    /// handles both the relative dev connection string and the absolute production one.
    /// </summary>
    public async Task<string> GetLiveDatabasePathAsync(CancellationToken ct = default)
    {
        var wasOpen = db.Database.GetDbConnection().State == System.Data.ConnectionState.Open;
        if (!wasOpen) await db.Database.OpenConnectionAsync(ct);
        try
        {
            var connection = db.Database.GetDbConnection();
            var cmd = connection.CreateCommand();
            await using (cmd.ConfigureAwait(false))
            {
                cmd.CommandText = "PRAGMA database_list;";
                var reader = await cmd.ExecuteReaderAsync(ct);
                await using (reader.ConfigureAwait(false))
                {
                    while (await reader.ReadAsync(ct))
                    {
                        if (string.Equals(reader.GetString(1), "main", StringComparison.OrdinalIgnoreCase))
                            return reader.GetString(2);
                    }
                }
            }
        }
        finally
        {
            if (!wasOpen) await db.Database.CloseConnectionAsync();
        }

        throw new InvalidOperationException("Could not resolve the live database file path.");
    }
}
