require "test_helper"

class JiraClientTest < ActiveSupport::TestCase
  test "turns connection failures into user-facing argument errors" do
    client = JiraClient.new(
      jira_url: "https://jira.example.com",
      jira_email: "user@example.com",
      jira_api_token: "token"
    )

    connection = Object.new
    connection.define_singleton_method(:get) do |_path|
      raise Faraday::ConnectionFailed, "connection failed"
    end

    client.singleton_class.define_method(:connection) { connection }

    error = assert_raises(ArgumentError) { client.fetch_issue("PROJ-1") }
    assert_equal "Kunde inte ansluta till Jira. Kontrollera Jira-URL och nätverk.", error.message
  end
end
