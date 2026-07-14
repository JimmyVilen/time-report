using System.Data.Common;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace TimeReport.Api.Data;

/// <summary>
/// Configures every SQLite connection the app opens with the PRAGMAs needed to avoid
/// "database is locked" errors under light concurrent access (a couple of users hitting
/// the API at once, e.g. one request reading while another writes).
///
/// - journal_mode=WAL: lets readers and a writer operate concurrently instead of the
///   default rollback-journal mode, where a writer blocks all readers. This is persisted
///   in the database file header, so it only needs to "take" once per file - but it's set
///   here on every open anyway because that's a cheap no-op once WAL is already active,
///   and it keeps all connection configuration in one place.
/// - busy_timeout: if SQLite still can't get a lock immediately (e.g. two requests writing
///   at the same instant), make it retry for a bit instead of throwing SQLITE_BUSY straight
///   away. This is a per-connection setting (not persisted in the file), so it must be
///   re-applied on every connection open, which is what this interceptor guarantees.
/// - synchronous=NORMAL: the recommended synchronous level for WAL mode (the WAL default
///   is FULL, same as rollback-journal mode). Also per-connection, not persisted.
///
/// Switching journal_mode requires briefly taking an exclusive lock to rewrite the file
/// header, which can transiently collide with another connection doing the same thing right
/// after open (e.g. EF Core's migration Exists() check opening back-to-back connections), or
/// with a third party transiently holding the file (e.g. antivirus real-time scanning on
/// Windows), and surface as SQLITE_READONLY/SQLITE_BUSY/SQLITE_LOCKED instead of just waiting -
/// busy_timeout doesn't cover this because it isn't in effect yet when this very PRAGMA runs.
/// Retried with backoff (capped, ~10s total budget) rather than failing the connection open
/// outright - observed real-world contention windows on Windows can exceed a second.
/// </summary>
public class SqlitePragmaInterceptor : DbConnectionInterceptor
{
    private const string PragmaSql =
        "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA synchronous=NORMAL;";

    private const int MaxAttempts = 15;
    private static readonly TimeSpan MaxDelay = TimeSpan.FromMilliseconds(1000);

    private static TimeSpan DelayFor(int attempt) =>
        TimeSpan.FromMilliseconds(Math.Min(200 * attempt, MaxDelay.TotalMilliseconds));

    public override void ConnectionOpened(DbConnection connection, ConnectionEndEventData eventData)
    {
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                using var cmd = connection.CreateCommand();
                cmd.CommandText = PragmaSql;
                cmd.ExecuteNonQuery();
                break;
            }
            catch (SqliteException ex) when (IsTransient(ex) && attempt < MaxAttempts)
            {
                Thread.Sleep(DelayFor(attempt));
            }
        }

        base.ConnectionOpened(connection, eventData);
    }

    public override async Task ConnectionOpenedAsync(
        DbConnection connection, ConnectionEndEventData eventData, CancellationToken cancellationToken = default)
    {
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                var cmd = connection.CreateCommand();
                await using (cmd.ConfigureAwait(false))
                {
                    cmd.CommandText = PragmaSql;
                    await cmd.ExecuteNonQueryAsync(cancellationToken);
                }
                break;
            }
            catch (SqliteException ex) when (IsTransient(ex) && attempt < MaxAttempts)
            {
                await Task.Delay(DelayFor(attempt), cancellationToken);
            }
        }

        await base.ConnectionOpenedAsync(connection, eventData, cancellationToken);
    }

    private static bool IsTransient(SqliteException ex) =>
        ex.SqliteErrorCode is 5 or 6 or 8; // SQLITE_BUSY, SQLITE_LOCKED, SQLITE_READONLY
}
