namespace Application.DTOs.Songs;

public class SongSegmentDto
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Type { get; set; } = "Text";
    public string? Content { get; set; }
    public Guid? ChordId { get; set; }
    public Guid? PatternId { get; set; }
    public int RepeatCount { get; set; } = 1;
    public string? Color { get; set; }
}