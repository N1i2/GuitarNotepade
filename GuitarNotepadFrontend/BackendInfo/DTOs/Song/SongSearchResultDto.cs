namespace Application.DTOs.Song;

public class SongSearchResultDto
{
    public List<SongDto> Songs { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

