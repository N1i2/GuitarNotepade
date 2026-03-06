namespace Application.DTOs.Song;

public class SegmentDataWithPositionDto
{
    public int PositionIndex { get; set; }
    public string? RepeatGroup { get; set; }
    public SegmentDataDto SegmentData { get; set; } = new();
}
