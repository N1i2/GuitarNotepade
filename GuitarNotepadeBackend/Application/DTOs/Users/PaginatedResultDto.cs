namespace Application.DTOs.Users;

public class PaginatedResultDto<T>
{
    public List<T> Items { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public int CurrentPage { get; set; }
    public bool HasPreviousPage => CurrentPage > 1;
    public bool HasNextPage => CurrentPage < TotalPages;

    public PaginatedResultDto(List<T> items, int totalCount, int currentPage, int pageSize)
    {
        Items = items;
        TotalCount = totalCount;
        CurrentPage = currentPage;
        TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
    }

    public static PaginatedResultDto<T> Create(List<T> items, int totalCount, int currentPage, int pageSize)
    {
        return new PaginatedResultDto<T>(items, totalCount, currentPage, pageSize);
    }
}