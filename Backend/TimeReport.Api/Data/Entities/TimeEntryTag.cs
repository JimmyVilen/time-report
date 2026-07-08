namespace TimeReport.Api.Data.Entities;

public class TimeEntryTag
{
    public int TimeEntryId { get; set; }
    public int TagId { get; set; }
    public TimeEntry TimeEntry { get; set; } = null!;
    public Tag Tag { get; set; } = null!;
}
