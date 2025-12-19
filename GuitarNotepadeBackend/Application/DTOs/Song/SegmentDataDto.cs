public class SegmentDataDto
{
    public string Type { get; set; } = string.Empty;
    public string? Lyric { get; set; }
    public Guid? ChordId { get; set; }
    public Guid? PatternId { get; set; }
    public int? Duration { get; set; }
    public string? Description { get; set; }
    public string? Color { get; set; }
    public string? BackgroundColor { get; set; }
}