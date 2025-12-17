namespace Application.DTOs.Songs;

public class SongFiltersDto
{
    public string? Search { get; set; }
    public string? Title { get; set; }
    public string? Artist { get; set; }
    public bool? IsPublic { get; set; }
    public Guid? OwnerId { get; set; }
    public Guid? ChordId { get; set; }
    public Guid? PatternId { get; set; }
    public bool? MySongsOnly { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string SortBy { get; set; } = "createdAt";
    public string SortOrder { get; set; } = "desc";
}