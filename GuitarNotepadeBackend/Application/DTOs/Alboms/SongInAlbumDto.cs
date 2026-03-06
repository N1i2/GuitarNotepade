namespace Application.DTOs.Alboms;

public class SongInAlbumDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Artist { get; set; }
    public string? Description { get; set; }
    public string? Genre { get; set; }
    public string? Theme { get; set; }
    public bool IsPublic { get; set; }
    public Guid OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int? AverageBeautifulRating { get; set; }
    public int? AverageDifficultyRating { get; set; }
    public int ReviewCount { get; set; }
    public int CommentsCount { get; set; }
    public int ChordCount { get; set; }
    public int PatternCount { get; set; }
    public string? CustomAudioUrl { get; set; }
    public string? CustomAudioType { get; set; }
    public bool HasAudio { get; set; }
}
