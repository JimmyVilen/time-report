namespace TimeReport.Api.Data.Entities;

public class Tag
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = "";
    public string? Color { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User User { get; set; } = null!;
    public ICollection<TimeEntry> TimeEntries { get; set; } = [];
}
