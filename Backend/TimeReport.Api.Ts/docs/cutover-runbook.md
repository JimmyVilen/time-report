# PostgreSQL cutover runbook

The application code does not initiate production cutover. Perform two rehearsals against disposable PostgreSQL targets before using this procedure.

1. Stop write traffic and the legacy container.
2. Create and verify a final SQLite `VACUUM INTO` backup outside the application.
3. Apply reviewed Drizzle migrations to an empty target with `npm run db:migrate`.
4. Run `npm run db:migrate:sqlite -- --source <backup.db>`; run once with `--dry-run` first.
5. Compare logged counts, verify relations and identity sequences, then test an existing BCrypt login.
6. Start the Node image with production secrets and smoke-test all product areas and exports.
7. Inspect application and database logs, connections, backups, retention and PITR before reopening writes.

Rollback during the verification window means stopping Node and write traffic, reconnecting the untouched SQLite backup, and starting the pinned .NET image. PostgreSQL writes made after cutover do not follow a rollback. Supabase backup/restore must be rehearsed against a separate project; it is deliberately not exposed as a web endpoint.
