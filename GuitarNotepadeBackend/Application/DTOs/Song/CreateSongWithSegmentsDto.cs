namespace Application.DTOs.Song;

public class CreateSongWithSegmentsDto
{
    public string Title { get; set; } = string.Empty;
    public string? Artist { get; set; }
    public string? Description { get; set; }
    public string Genre { get; set; } = string.Empty;
    public string Theme { get; set; } = string.Empty;
    public bool IsPublic { get; set; } = true;
    public Guid? ParentSongId { get; set; }

    public List<SegmentDataWithPositionDto> Segments { get; set; } = new();

    public Dictionary<int, List<CreateSongCommentDto>> SegmentComments { get; set; } = new();
}

public class SegmentDataWithPositionDto
{
    public SegmentDataDto SegmentData { get; set; } = null!;
    public int PositionIndex { get; set; }
    public string? RepeatGroup { get; set; }
}

