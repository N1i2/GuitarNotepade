namespace Application.DTOs.Song;

public class FullSongDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Artist { get; set; }
    public string Genre { get; set; } = string.Empty;
    public string Theme { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPublic { get; set; }
    public Guid OwnerId { get; set; }
    public string? OwnerName { get; set; }
    public Guid? ParentSongId { get; set; }
    public string? ParentSongTitle { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int ReviewCount { get; set; }
    public double? AverageBeautifulRating { get; set; }
    public double? AverageDifficultyRating { get; set; }

    public List<SongChordDto> Chords { get; set; } = new();
    public List<SongPatternDto> Patterns { get; set; } = new();
    public List<SongCommentDto> Comments { get; set; } = new();
    public List<SegmentDataWithPositionDto> Segments { get; set; } = new();
}