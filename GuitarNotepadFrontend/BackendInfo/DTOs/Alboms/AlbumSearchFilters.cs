namespace Application.DTOs.Alboms;

public class AlbumSearchFilters
{
    public Guid UserId { get; set; } = Guid.Empty;
    public string? SearchTerm { get; set; }
    public Guid? OwnerId { get; set; }
    public bool? IsPublic { get; set; }
    public string? Genre { get; set; }
    public string? Theme { get; set; }
    public string SortBy { get; set; } = "createdAt";
    public string SortOrder { get; set; } = "desc";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
