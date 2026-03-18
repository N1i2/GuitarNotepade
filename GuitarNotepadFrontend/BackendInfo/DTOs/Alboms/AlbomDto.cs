namespace Application.DTOs.Alboms;

public class AlbumDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? CoverUrl { get; set; }
    public string? Description { get; set; }
    public bool IsPublic { get; set; }
    public string Genre { get; set; } = string.Empty;
    public string Theme { get; set; } = string.Empty;
    public Guid OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int CountOfSongs { get; set; }
}
