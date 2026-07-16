namespace TimeReport.Api.Data.Entities;

public class TaskDefaultTag
{
    public int TaskId { get; set; }
    public int TagId { get; set; }
    public AppTask Task { get; set; } = null!;
    public Tag Tag { get; set; } = null!;
}
