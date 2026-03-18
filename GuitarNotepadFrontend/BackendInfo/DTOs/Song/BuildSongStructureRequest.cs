namespace Application.DTOs.Song;

public class BuildSongStructureRequest
{
    public List<SegmentDataDto> Segments { get; set; } = new();
    public Dictionary<int, string>? RepeatGroups { get; set; }
}
