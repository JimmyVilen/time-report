class DashboardController < ApplicationController
  def index
    @selected_date = safe_parse_date(params[:date]).iso8601
    @tasks         = current_user.tasks.active.ordered
    @time_entries  = current_user.time_entries
                       .where(date: @selected_date)
                       .includes(:task)
                       .order(position: :asc)
    @daily_note    = current_user.daily_notes.find_by(date: @selected_date)
    @new_entry     = TimeEntry.new(date: @selected_date)

    week_start    = Date.iso8601(@selected_date).beginning_of_week(:monday)
    week_end      = week_start + 6
    week_entries  = current_user.time_entries
                      .where(date: week_start.iso8601..week_end.iso8601)
                      .order(date: :asc)
    @weekly_days  = build_weekly_days(week_start, week_end, week_entries)
    @week_number  = Date.parse(@selected_date).cweek
    @week_total   = @weekly_days.sum { |d| d[:total_minutes] }
  end

  private

  def safe_parse_date(str)
    Date.iso8601(str.to_s)
  rescue ArgumentError, TypeError
    Date.today
  end

  def build_weekly_days(week_start, week_end, entries)
    (week_start..week_end).map do |d|
      day_entries = entries.select { |e| e.date == d }
      {
        date:          d.iso8601,
        day_name:      I18n.l(d, format: :day_name),
        first_start:   day_entries.filter_map(&:start_time).min&.strftime("%H:%M"),
        last_end:      day_entries.filter_map(&:end_time).max&.strftime("%H:%M"),
        total_minutes: day_entries.sum { |e| e.effective_duration_minutes.to_i }
      }
    end
  end
end
