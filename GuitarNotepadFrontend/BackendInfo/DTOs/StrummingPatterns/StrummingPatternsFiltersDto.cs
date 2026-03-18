namespace Application.DTOs.StrummingPatterns;

public class StrummingPatternsFiltersDto
{
    public string? Name { get; set; }
    public bool? MyPatternsOnly { get; set; } = false;
    public bool? IsFingerStyle { get; set; }
    public Guid? UserId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string SortBy { get; set; } = "name";
    public string SortOrder { get; set; } = "asc";
}
