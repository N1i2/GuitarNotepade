public class SegmentLabelDto
{
    public Guid Id { get; set; }
    public Guid SegmentId { get; set; }
    public Guid LabelId { get; set; }
    public SongLabelDto Label { get; set; } = null!;
    public SongSegmentDto Segment { get; set; } = null!;
}