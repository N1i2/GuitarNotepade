namespace Domain.Entities.HelpEntitys;

public class SongLabel
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
    public List<string> SegmentIds { get; set; } = new();
}