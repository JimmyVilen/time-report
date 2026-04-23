require "test_helper"

class TimeEntriesControllerTest < ActionDispatch::IntegrationTest
  test "invalid time input raises instead of being treated as blank" do
    controller = TimeEntriesController.new

    error = assert_raises(ArgumentError) do
      controller.send(:parse_time_input, "25:00", "2026-04-23", "Starttid")
    end

    assert_equal "Starttid måste anges som HH:MM", error.message
  end
end
