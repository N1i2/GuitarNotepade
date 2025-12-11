namespace Application.DTOs.Chords;

public class PaginatedChordsDto
{
    public List<ChordDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public int CurrentPage { get; set; }
    public bool HasPreviousPage { get; set; }
    public bool HasNextPage { get; set; }

    public static PaginatedChordsDto Create(
        List<ChordDto> items,
        int totalCount,
        int page,
        int pageSize)
    {
        return new PaginatedChordsDto
        {
            Items = items,
            TotalCount = totalCount,
            CurrentPage = page,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            HasPreviousPage = page > 1,
            HasNextPage = page < (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }
}