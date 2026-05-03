namespace Application.DTOs.Alboms;

public class AlbumSearchResultDto
{
    public List<AlbumDto> Albums { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
