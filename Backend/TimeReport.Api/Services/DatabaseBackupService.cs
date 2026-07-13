using Microsoft.EntityFrameworkCore;
using TimeReport.Api.Data;

namespace TimeReport.Api.Services;

/// <summary>
/// Periodically snapshots the live SQLite database into Backup:Directory (a Dropbox-synced
/// folder) using VACUUM INTO, which produces a single self-contained file with no -wal/-shm
/// sidecars - safe to run against a live WAL-mode database and safe for Dropbox to sync,
/// unlike the live database file itself.
/// </summary>
public class DatabaseBackupService(
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    ILogger<DatabaseBackupService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var directory = configuration["Backup:Directory"] ?? "/app/backup";
        var intervalMinutes = configuration.GetValue("Backup:IntervalMinutes", 360);
        var retentionCount = configuration.GetValue("Backup:RetentionCount", 14);

        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(intervalMinutes));
        do
        {
            try
            {
                await RunBackupAsync(directory, retentionCount, stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Database backup failed; will retry next interval");
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task RunBackupAsync(string directory, int retentionCount, CancellationToken ct)
    {
        Directory.CreateDirectory(directory);
        var destPath = Path.Combine(directory, $"local-{DateTime.UtcNow:yyyyMMdd-HHmmss}.db");

        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.OpenConnectionAsync(ct);
        try
        {
            var connection = db.Database.GetDbConnection();
            var cmd = connection.CreateCommand();
            await using (cmd.ConfigureAwait(false))
            {
                var param = cmd.CreateParameter();
                param.ParameterName = "$path";
                param.Value = destPath;
                cmd.Parameters.Add(param);
                cmd.CommandText = "VACUUM INTO $path";
                await cmd.ExecuteNonQueryAsync(ct);
            }
        }
        finally
        {
            await db.Database.CloseConnectionAsync();
        }

        logger.LogInformation("Database backup written to {Path}", destPath);
        PruneOldBackups(directory, retentionCount);
    }

    private void PruneOldBackups(string directory, int retentionCount)
    {
        var stale = new DirectoryInfo(directory)
            .GetFiles("local-*.db")
            .OrderByDescending(f => f.Name)
            .Skip(retentionCount);

        foreach (var file in stale)
        {
            try
            {
                file.Delete();
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to prune old backup {File}", file.Name);
            }
        }
    }
}
