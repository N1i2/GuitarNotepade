using Application.DTOs.Song;

public class SongSegmentDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Lyric { get; set; }
    public int? Duration { get; set; }
    public string? Description { get; set; }
    public string? Color { get; set; }
    public string? BackgroundColor { get; set; }

    public Guid? ChordId { get; set; }
    public SongChordDto? Chord { get; set; }

    public Guid? PatternId { get; set; }
    public SongPatternDto? Pattern { get; set; }

    public List<SongLabelDto> Labels { get; set; } = new();
}
