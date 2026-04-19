class Task < ApplicationRecord
  self.table_name = "tasks"

  belongs_to :user
  has_many :time_entries, dependent: :destroy

  attribute :is_favorite, :boolean, default: false
  attribute :is_archived, :boolean, default: false

  scope :active,   -> { where(is_archived: false) }
  scope :archived, -> { where(is_archived: true) }
  scope :ordered,  -> { order(is_favorite: :desc, last_used_at: :desc, created_at: :desc) }

  validates :title, presence: true

  def destroy_or_archive!
    if time_entries.exists?
      update!(is_archived: true)
      :archived
    else
      destroy!
      :destroyed
    end
  end

  def jira_key
    return nil if jira_url.blank?
    uri = URI.parse(jira_url.strip.chomp("/"))
    last = uri.path.split("/").last
    last.to_s.split("?").first.presence
  rescue URI::InvalidURIError
    nil
  end
end
