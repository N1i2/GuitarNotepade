using Domain.Common;

namespace Domain.Entities.HelpEntitys;

public class SongSegment
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public SegmentType Type { get; set; } = SegmentType.Text;

    public string? Lyric { get; set; }

    public int? Duration { get; set; }
    public string? Description { get; set; }

    public Guid? ChordId { get; set; }
    public Guid? PatternId { get; set; }

    public string? Color { get; set; }
    public string? BackgroundColor { get; set; }

    public int RepeatCount { get; set; } = 1;
    public string? RepeatGroup { get; set; }

    public int? StartIndex { get; set; }
    public int? Length { get; set; }
}