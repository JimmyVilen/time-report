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
end
