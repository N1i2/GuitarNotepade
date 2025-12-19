using Application.DTOs.StrummingPatterns;

public class SongStructureDto
{
    public Guid Id { get; set; }
    public Guid SongId { get; set; }
    public List<SongSegmentPositionDto> SegmentPositions { get; set; } = new();
    public Dictionary<string, List<SongSegmentDto>> RepeatGroups { get; set; } = new();
}