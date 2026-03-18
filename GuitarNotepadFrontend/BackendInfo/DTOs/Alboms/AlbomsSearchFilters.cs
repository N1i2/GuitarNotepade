namespace Application.DTOs.Alboms;

public record AlbomsSearchFilters
{
    public Guid userId { get; set; }
    public string? SearchTerm { get; set; }
    public Guid? OwnerId { get; set; }
    public bool? IsPublic { get; set; }
    public DateTime? CreatedFrom { get; set; }
    public DateTime? CreatedTo { get; set; }
    public string SortBy { get; set; } = "createdAt";
    public string SortOrder { get; set; } = "desc";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
