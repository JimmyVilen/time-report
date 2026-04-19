class TimeEntriesController < ApplicationController
  before_action :set_entry, only: [:edit, :update, :destroy, :push_to_jira]

  def new
    @date  = params[:date] || Date.today.iso8601
    @entry = TimeEntry.new(date: @date)
    @tasks = current_user.tasks.active.ordered
  end

  def create
    @date  = params.dig(:time_entry, :date) || Date.today.iso8601
    @tasks = current_user.tasks.active.ordered
    @entry = current_user.time_entries.build(date: @date)
    @entry.task_id     = params.dig(:time_entry, :task_id)
    @entry.description = params.dig(:time_entry, :description)

    begin
      resolved = TimeEntryResolver.resolve(
        date_str:         @date,
        start_time:       parse_time_input(params.dig(:time_entry, :start_time), @date),
        end_time:         parse_time_input(params.dig(:time_entry, :end_time), @date),
        duration_minutes: DurationParser.parse(params.dig(:time_entry, :duration))
      )
      @entry.assign_attributes(resolved)
    rescue ArgumentError => e
      flash.now[:alert] = e.message
      return render :new, status: :unprocessable_entity
    end

    current_user.time_entries.where(date: @date).update_all("position = position + 1")
    @entry.position = 0

    if @entry.save
      @entry.task.touch(:last_used_at)
      respond_to do |format|
        format.turbo_stream {
          render turbo_stream: [
            turbo_stream.prepend("time-entries-#{@date}",
              partial: "time_entries/time_entry", locals: { entry: @entry }),
            turbo_stream.replace("time-entries-total",
              partial: "time_entries/total",
              locals: { entries: current_user.time_entries.where(date: @date).includes(:task).order(position: :asc) }),
            turbo_stream.replace("new-entry-form",
              partial: "time_entries/new_form",
              locals: { entry: TimeEntry.new(date: @date), date: @date, tasks: @tasks })
          ]
        }
        format.html { redirect_to dashboard_path(date: @date) }
      end
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @date  = @entry.date
    @tasks = current_user.tasks.active.ordered
  end

  def update
    @date  = @entry.date
    @tasks = current_user.tasks.active.ordered

    begin
      resolved = TimeEntryResolver.resolve(
        date_str:         @date,
        start_time:       parse_time_input(params.dig(:time_entry, :start_time), @date),
        end_time:         parse_time_input(params.dig(:time_entry, :end_time), @date),
        duration_minutes: DurationParser.parse(params.dig(:time_entry, :duration))
      )
      attrs = resolved.merge(
        task_id:     params.dig(:time_entry, :task_id) || @entry.task_id,
        description: params.dig(:time_entry, :description)
      )
      @entry.assign_attributes(attrs)
    rescue ArgumentError => e
      flash.now[:alert] = e.message
      return render :edit, status: :unprocessable_entity
    end

    if @entry.save
      respond_to do |format|
        format.turbo_stream {
          render turbo_stream: [
            turbo_stream.replace(dom_id(@entry),
              partial: "time_entries/time_entry", locals: { entry: @entry.reload }),
            turbo_stream.replace("time-entries-total",
              partial: "time_entries/total",
              locals: { entries: current_user.time_entries.where(date: @date).includes(:task).order(position: :asc) })
          ]
        }
        format.html { redirect_to dashboard_path(date: @date) }
      end
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    date = @entry.date
    @entry.destroy!
    respond_to do |format|
      format.turbo_stream {
        render turbo_stream: [
          turbo_stream.remove(dom_id(@entry)),
          turbo_stream.replace("time-entries-total",
            partial: "time_entries/total",
            locals: { entries: current_user.time_entries.where(date: date).includes(:task).order(position: :asc) })
        ]
      }
      format.html { redirect_to dashboard_path(date: date) }
    end
  end

  def reorder
    entries_data = params[:entries]
    return head :bad_request unless entries_data.is_a?(Array)

    entries_data.each do |ep|
      current_user.time_entries.where(id: ep[:id].to_i).update_all(position: ep[:position].to_i)
    end
    head :ok
  end

  def weekly_summary
    date       = Date.parse(params[:date] || Date.today.iso8601)
    week_start = date.beginning_of_week(:monday)
    week_end   = week_start + 6
    entries    = current_user.time_entries
                   .where(date: week_start.iso8601..week_end.iso8601)
                   .order(date: :asc)

    days = (week_start..week_end).map do |d|
      day_entries = entries.select { |e| e.date == d }
      {
        date:          d.iso8601,
        day_name:      I18n.l(d, format: :day_name),
        first_start:   day_entries.filter_map(&:start_time).min&.strftime("%H:%M"),
        last_end:      day_entries.filter_map(&:end_time).max&.strftime("%H:%M"),
        total_minutes: day_entries.sum { |e| e.effective_duration_minutes.to_i }
      }
    end

    render json: {
      week_number:   date.cweek,
      total_minutes: days.sum { |d| d[:total_minutes] },
      days:          days
    }
  end

  def recent_description
    task_id = params[:task_id].to_i
    entry   = current_user.time_entries
                .where(task_id: task_id)
                .where.not(description: [nil, ""])
                .order(date: :desc, created_at: :desc)
                .pick(:description)
    render json: { description: entry }
  end

  def push_to_jira
    unless @entry.can_push_to_jira?
      return render json: { error: "Tidsrapporten måste ha start- och sluttid samt varaktighet" },
                    status: :unprocessable_entity
    end

    task = @entry.task
    return render json: { error: "Task saknar Jira-URL" }, status: :bad_request unless task.jira_url.present?

    issue_key = JiraClient.extract_issue_key(task.jira_url)
    return render json: { error: "Kunde inte extrahera issue key från Jira-URL" }, status: :bad_request unless issue_key

    u = current_user
    unless u.jira_url.present? && u.jira_email.present? && u.jira_api_token.present?
      return render json: { error: "Jira-konfiguration saknas. Gå till Profil." }, status: :bad_request
    end

    client  = JiraClient.new(jira_url: u.jira_url, jira_email: u.jira_email, jira_api_token: u.jira_api_token)
    started = JiraClient.format_worklog_date(@entry.start_time)
    worklog = client.create_worklog(
      issue_key:          issue_key,
      time_spent_seconds: @entry.duration_minutes * 60,
      started:            started,
      comment:            @entry.description
    )

    @entry.update!(
      pushed_to_system: "JIRA_CLOUD",
      pushed_at:        Time.current,
      jira_worklog_id:  worklog["id"]
    )

    respond_to do |format|
      format.turbo_stream {
        render turbo_stream: turbo_stream.replace(
          dom_id(@entry), partial: "time_entries/time_entry", locals: { entry: @entry.reload }
        )
      }
      format.json { render json: { success: true } }
    end
  rescue ArgumentError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def set_entry
    @entry = current_user.time_entries.find(params[:id])
  end

  def parse_time_input(value, date_str)
    return nil if value.blank?
    Time.parse("#{date_str}T#{value}:00")
  rescue ArgumentError, TypeError
    nil
  end
end
