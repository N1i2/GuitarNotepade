namespace Application.DTOs.Songs;

public class CreateSongRequestDto
{
    public string Title { get; set; } = string.Empty;
    public string? Artist { get; set; }
    public bool IsPublic { get; set; } = true;
    public Guid? ParentSongId { get; set; }
    public SongStructureDto? Structure { get; set; }
    public List<Guid>? ChordIds { get; set; }
    public List<Guid>? PatternIds { get; set; }
}