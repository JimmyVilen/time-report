ActiveSupport.on_load(:active_record) do
  ActiveRecord::Base.connection.execute("PRAGMA journal_mode=WAL")
  ActiveRecord::Base.connection.execute("PRAGMA busy_timeout=5000")
rescue => e
  Rails.logger.warn "Could not set SQLite PRAGMA: #{e.message}"
end
