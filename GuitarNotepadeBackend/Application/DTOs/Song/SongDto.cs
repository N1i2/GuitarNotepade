namespace Application.DTOs.Song;

public class SongDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Artist { get; set; }
    public string? Description { get; set; }
    public bool IsPublic { get; set; }
    public Guid OwnerId { get; set; }
    public string? OwnerName { get; set; }
    public Guid? ParentSongId { get; set; }
    public string? ParentSongTitle { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int ReviewCount { get; set; }
    public decimal? AverageBeautifulRating { get; set; }
    public decimal? AverageDifficultyRating { get; set; }
    public int TotalLikes { get; set; }
    public int TotalDislikes { get; set; }

    public List<SongChordDto> Chords { get; set; } = new();
    public List<SongPatternDto> Patterns { get; set; } = new();
    public int CommentsCount { get; set; }
    public int SegmentsCount { get; set; }
}
