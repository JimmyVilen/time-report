using TimeReport.Api.Data;

namespace TimeReport.Api.Services;

/// <summary>
/// Periodically snapshots the live SQLite database into Backup:Directory (a Dropbox-synced
/// folder) via DatabaseSnapshotService, which uses VACUUM INTO - safe to run against a live
/// WAL-mode database and produces a single file safe for Dropbox to sync, unlike the live
/// database file itself.
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
        using var scope = scopeFactory.CreateScope();
        var snapshotService = scope.ServiceProvider.GetRequiredService<DatabaseSnapshotService>();
        var destPath = Path.Combine(directory, DatabaseSnapshotService.GenerateSnapshotFileName("local"));
        await snapshotService.CreateSnapshotAsync(destPath, ct);

        PruneOldBackups(directory, "local-*.db", retentionCount);
        PruneOldBackups(directory, "pre-import-*.db", retentionCount);
    }

    private void PruneOldBackups(string directory, string pattern, int retentionCount)
    {
        if (!Directory.Exists(directory)) return;

        var stale = new DirectoryInfo(directory)
            .GetFiles(pattern)
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
