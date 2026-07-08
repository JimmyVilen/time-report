using System.Data.Common;
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
/// </summary>
public class SqlitePragmaInterceptor : DbConnectionInterceptor
{
    private const string PragmaSql =
        "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA synchronous=NORMAL;";

    public override void ConnectionOpened(DbConnection connection, ConnectionEndEventData eventData)
    {
        using var cmd = connection.CreateCommand();
        cmd.CommandText = PragmaSql;
        cmd.ExecuteNonQuery();

        base.ConnectionOpened(connection, eventData);
    }

    public override async Task ConnectionOpenedAsync(
        DbConnection connection, ConnectionEndEventData eventData, CancellationToken cancellationToken = default)
    {
        var cmd = connection.CreateCommand();
        await using (cmd.ConfigureAwait(false))
        {
            cmd.CommandText = PragmaSql;
            await cmd.ExecuteNonQueryAsync(cancellationToken);
        }

        await base.ConnectionOpenedAsync(connection, eventData, cancellationToken);
    }
}
