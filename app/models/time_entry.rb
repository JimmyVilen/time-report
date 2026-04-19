class TimeEntry < ApplicationRecord
  self.table_name = "time_entries"

  belongs_to :user
  belongs_to :task

  validates :date, presence: true, format: { with: /\A\d{4}-\d{2}-\d{2}\z/ }

  def effective_duration_minutes
    if start_time && end_time
      diff = ((end_time - start_time) / 60).round
      diff > 0 ? diff : duration_minutes
    else
      duration_minutes
    end
  end

  def can_push_to_jira?
    return false unless task&.jira_url.present?
    return false unless duration_minutes.to_i > 0
    return false unless start_time && end_time
    diff = ((end_time - start_time) / 60).round
    diff > 0 && diff == duration_minutes
  end

  def pushed?
    pushed_to_system.present?
  end
end
