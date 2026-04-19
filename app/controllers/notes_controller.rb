class NotesController < ApplicationController
  def index
    @query = params[:q].to_s.strip
    scope  = current_user.daily_notes.order(date: :desc)
    scope  = scope.where("content LIKE ?", "%#{@query}%") if @query.present?
    @notes = scope
  end
end
