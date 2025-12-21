namespace Application.DTOs.Song;

public class SegmentDataWithPositionDto
{
    public SegmentDataDto SegmentData { get; set; } = null!;
    public int PositionIndex { get; set; }
    public string? RepeatGroup { get; set; }
}
