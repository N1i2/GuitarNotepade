namespace Application.DTOs.Songs;

public class UpdateSongRequestDto
{
    public string? Title { get; set; }
    public string? Artist { get; set; }
    public bool? IsPublic { get; set; }
    public SongStructureDto? Structure { get; set; }
    public List<Guid>? ChordIds { get; set; }
    public List<Guid>? PatternIds { get; set; }
}