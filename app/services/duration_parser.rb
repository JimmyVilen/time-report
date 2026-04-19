class DurationParser
  PAIR_RE = /(\d+(?:\.\d+)?)\s*(h|m)\b/i

  def self.parse(raw)
    return nil if raw.blank?
    trimmed = raw.strip.downcase
    return nil if trimmed.start_with?("-")

    total = 0
    matched = false
    last_idx = 0

    trimmed.scan(PAIR_RE) do |n_str, unit|
      n = n_str.to_f
      return nil unless n.finite? && n >= 0
      total += unit == "h" ? (n * 60).round : n.round
      matched = true
      last_idx = $~.end(0)
    end

    return nil unless matched

    rest = trimmed[last_idx..].gsub(/\s+/, "")
    return nil if rest.length > 0
    return nil unless total > 0

    total
  end

  def self.format_minutes(minutes)
    return "0m" if minutes.to_i <= 0
    h = minutes / 60
    m = minutes % 60
    if h > 0 && m > 0
      "#{h}h #{m}m"
    elsif h > 0
      "#{h}h"
    else
      "#{m}m"
    end
  end
end
