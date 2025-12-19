public class SongSegmentPositionDto
{
    public Guid Id { get; set; }
    public int PositionIndex { get; set; }
    public string? RepeatGroup { get; set; }
    public SongSegmentDto Segment { get; set; } = null!;
}