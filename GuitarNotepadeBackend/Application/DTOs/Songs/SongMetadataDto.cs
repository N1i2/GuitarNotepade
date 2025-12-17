namespace Application.DTOs.Songs;

public class SongMetadataDto
{
    public string? Key { get; set; }
    public string? Tempo { get; set; }
    public string? Difficulty { get; set; }
    public List<SongCommentDto> Comments { get; set; } = new();
    public List<SongLabelDto> Labels { get; set; } = new();
}