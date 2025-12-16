using Application.DTOs.Chords;

namespace Application.DTOs.Generic;

public class PaginatedDto<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public int CurrentPage { get; set; }
    public bool HasPreviousPage { get; set; }
    public bool HasNextPage { get; set; }

    public static PaginatedDto<T> Create(
        List<T> items,
        int totalCount,
        int page,
        int pageSize)
    {
        return new PaginatedDto<T>
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