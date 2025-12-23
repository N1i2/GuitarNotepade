namespace Application.DTOs.Song;

public class UpdateSongWithSegmentsDto
{
    public Guid Id { get; set; }
    public string? Title { get; set; } = null;
    public string? Artist { get; set; } = null;
    public string? Description { get; set; } = null;
    public string? Genre { get; set; } = null;
    public string? Theme { get; set; } = null;
    public string? CustomAudioUrl { get; set; } = null;
    public string? CustomAudioType { get; set; } = null;

    public bool? IsPublic { get; set; } = null;
    public Guid? ParentSongId { get; set; } = null;

    public List<Guid>? OldSegments { get; set; } = null;
    public Dictionary<int, List<Guid>>? OldComments { get; set; } = null;
    public List<SegmentDataWithPositionDto>? Segments { get; set; } = null;
    public Dictionary<int, List<CreateSongCommentDto>>? SegmentComments { get; set; } = null;
}
