namespace Application.DTOs.Song;

public class SongSegmentPositionDto
{
    public Guid Id { get; set; }
    public Guid SongId { get; set; }
    public Guid SegmentId { get; set; }
    public int PositionIndex { get; set; }
    public string? RepeatGroup { get; set; }
    public SongSegmentDto Segment { get; set; } = new();
}

