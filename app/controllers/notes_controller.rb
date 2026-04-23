class NotesController < ApplicationController
  def index
    @query = params[:q].to_s.strip
    scope  = current_user.daily_notes.order(date: :desc)
    scope  = scope.where("content LIKE ?", "%#{@query}%") if @query.present?
    @notes = scope
  end

  def export
    from = safe_parse_date(params[:from])
    to   = safe_parse_date(params[:to])

    if params[:from].present? && params[:to].present?
      require "csv"
      notes = current_user.daily_notes
                .where(date: from.iso8601..to.iso8601)
                .order(:date)

      csv_data = CSV.generate(headers: true) do |csv|
        csv << [ "Datum", "Notering" ]
        notes.each { |n| csv << [ n.date, n.content ] }
      end

      send_data csv_data,
                filename: "noteringar-#{from}-#{to}.csv",
                type: "text/csv; charset=utf-8"
    else
      @from = (Date.today - 1.week).beginning_of_week(:monday).iso8601
      @to   = (Date.today - 1.week).end_of_week(:monday).iso8601
      render "time_entries/export"
    end
  end

  private

  def safe_parse_date(str)
    Date.iso8601(str.to_s)
  rescue ArgumentError, TypeError
    Date.today
  end
end
