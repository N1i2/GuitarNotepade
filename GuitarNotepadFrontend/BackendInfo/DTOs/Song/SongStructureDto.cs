namespace Application.DTOs.Song;

public class SongStructureDto
{
    public Guid Id { get; set; }
    public Guid SongId { get; set; }
    public List<SongSegmentPositionDto> SegmentPositions { get; set; } = new();
    public Dictionary<string, List<int>>? RepeatGroups { get; set; }

    public List<SegmentDataWithPositionDto> Segments
    {
        get
        {
            return SegmentPositions.Select(sp => new SegmentDataWithPositionDto
            {
                PositionIndex = sp.PositionIndex,
                RepeatGroup = sp.RepeatGroup,
                SegmentData = new SegmentDataDto
                {
                    Id = sp.Segment.Id,
                    Type = sp.Segment.Type,
                    Lyric = sp.Segment.Lyric,
                    ChordId = sp.Segment.ChordId,
                    PatternId = sp.Segment.PatternId,
                    Duration = sp.Segment.Duration,
                    Description = sp.Segment.Description,
                    Color = sp.Segment.Color,
                    BackgroundColor = sp.Segment.BackgroundColor
                }
            }).ToList();
        }
    }
}

