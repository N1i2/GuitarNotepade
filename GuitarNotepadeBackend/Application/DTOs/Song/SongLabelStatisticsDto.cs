public class SongLabelStatisticsDto
{
    public Guid LabelId { get; set; }
    public string LabelName { get; set; } = string.Empty;
    public string? LabelColor { get; set; }
    public int UsageCount { get; set; }
    public List<Guid> SegmentIds { get; set; } = new();
    public List<Guid> SongIds { get; set; } = new();
}