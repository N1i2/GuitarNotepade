namespace Application.DTOs.Song;

public record GrudeSongDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Artist { get; set; }
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

    public int ChordsCount { get; set; } = new();
    public int PatternsCount { get; set; } = new();
    public int CommentsCount { get; set; }
    public int SegmentsCount { get; set; }
}
