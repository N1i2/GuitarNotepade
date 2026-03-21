namespace Application.DTOs.Song;

public class CreateSongDto
{
    public string Title { get; set; } = string.Empty;
    public string? Genre { get; set; }
    public string? Theme { get; set; }
    public string? Artist { get; set; }
    public string? Description { get; set; }
    public bool IsPublic { get; set; }
    public string? AudioBase64 { get; set; }
    public string? AudioType { get; set; }
    public Guid? ParentSongId { get; set; }
    public string? CustomAudioUrl { get; set; }
    public string? CustomAudioType { get; set; }
}
