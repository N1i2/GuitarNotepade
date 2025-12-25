namespace Application.DTOs.Alboms;

public class UpdateAlbumDto
{
    public string? Title { get; set; }
    public string? CoverUrl { get; set; }
    public string? Description { get; set; }
    public bool? IsPublic { get; set; }
    public string? Genre { get; set; }
    public string? Theme { get; set; }
}
