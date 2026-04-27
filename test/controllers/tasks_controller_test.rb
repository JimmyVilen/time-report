require "test_helper"

class TasksControllerTest < ActionDispatch::IntegrationTest
  test "rejects assigning a task to another users project" do
    owner = create_user(email: "project-owner@example.com")
    other = create_user(email: "task-owner@example.com")
    foreign_project = owner.projects.create!(name: "Private Project")

    sign_in_as(other)

    assert_no_difference("Task.count") do
      post tasks_path, params: {
        task: {
          title: "Cross-account task",
          project_id: foreign_project.id
        }
      }
    end

    assert_response :unprocessable_entity
  end

  test "fetches jira details with issue summary" do
    user = create_user(email: "jira-task-owner@example.com")
    user.update!(
      jira_url: "https://jira.example.com",
      jira_email: "jira-task-owner@example.com",
      jira_api_token: "token"
    )
    sign_in_as(user)

    requested_issue_key = nil
    client = Object.new
    client.define_singleton_method(:fetch_issue) do |issue_key|
      requested_issue_key = issue_key
      { summary: "Jira task title", description: "Jira task description" }
    end

    original_new = JiraClient.method(:new)
    JiraClient.define_singleton_method(:new) { |**_kwargs| client }
    begin
      get jira_fetch_details_path,
        params: { jira_url: "https://jira.example.com/browse/PROJ-123" },
        as: :json
    ensure
      JiraClient.define_singleton_method(:new) { |*args, **kwargs, &block| original_new.call(*args, **kwargs, &block) }
    end

    assert_response :success
    assert_equal "PROJ-123", requested_issue_key

    body = JSON.parse(response.body)
    assert_equal "Jira task title", body["summary"]
    assert_equal "Jira task description", body["description"]
  end
end
