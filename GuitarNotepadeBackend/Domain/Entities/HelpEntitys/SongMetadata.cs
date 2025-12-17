namespace Domain.Entities.HelpEntitys;

public class SongMetadata
{
    public List<SongComment> Comments { get; set; } = new();
    public List<SongLabel> Labels { get; set; } = new();
    public TempoInfo? Tempo { get; set; }
    public string? Key { get; set; }
    public string? Difficulty { get; set; }
}