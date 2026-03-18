namespace Application.DTOs.Alboms;

public class CreateAlbumDto
{
    public string Title { get; set; } = string.Empty;
    public string? CoverUrl { get; set; }
    public string? Description { get; set; }
    public bool IsPublic { get; set; }
    public string? Genre { get; set; } = string.Empty;
    public string? Theme { get; set; } = string.Empty;
}
