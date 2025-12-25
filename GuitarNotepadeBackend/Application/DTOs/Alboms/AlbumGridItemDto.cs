namespace Application.DTOs.Alboms;

public class AlbumGridItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
    public Guid OwnerId { get; set; }
    public string OwnerNickname { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool CanEdit { get; set; }
    public string? Genre { get; set; }
    public string? Theme { get; set; }
    public int CountOfSongs { get; set; }
    public string? CoverUrl { get; set; }
    public string? Description { get; set; }
}
