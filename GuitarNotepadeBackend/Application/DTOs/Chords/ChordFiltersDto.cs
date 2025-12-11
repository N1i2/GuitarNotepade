namespace Application.DTOs.Chords;

public class ChordFiltersDto
{
    public string? Name { get; set; }
    public bool? MyChordsOnly { get; set; } = false;
    public Guid? UserId { get; set; } 
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string SortBy { get; set; } = "name";
    public string SortOrder { get; set; } = "asc";
}