using System.Text.Json.Serialization;

namespace Application.DTOs.Song;

public class BuildSongStructureRequest
{
    public List<SegmentDataDto> Segments { get; set; } = new();
    public Dictionary<int, string>? RepeatGroups { get; set; }
    [JsonPropertyName("segmentComments")]
    public Dictionary<int, List<SegmentCommentDto>>? SegmentComments { get; set; }
}
