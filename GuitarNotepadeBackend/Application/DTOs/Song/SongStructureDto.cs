namespace Application.DTOs.Song;

public class SongStructureDto
{
    public Guid Id { get; set; }
    public Guid SongId { get; set; }
    public List<SongSegmentPositionDto> SegmentPositions { get; set; } = new();
    public Dictionary<string, List<int>>? RepeatGroups { get; set; }
}

