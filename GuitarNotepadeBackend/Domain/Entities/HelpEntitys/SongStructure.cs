namespace Domain.Entities.HelpEntitys;

public class SongStructure
{
    public List<SongSegment> Segments { get; set; } = new();
    public SongMetadata Metadata { get; set; } = new();
    public Dictionary<string, object>? CustomFields { get; set; }
}