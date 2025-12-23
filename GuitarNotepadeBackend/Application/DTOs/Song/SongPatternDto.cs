public class SongPatternDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Pattern { get; set; } = string.Empty;
    public bool IsFingerStyle { get; set; }
    public string? Description { get; set; }
}
