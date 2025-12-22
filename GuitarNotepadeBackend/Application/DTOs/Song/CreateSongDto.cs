public class CreateSongDto
{
    public string Title { get; set; } = string.Empty;
    public string? Artist { get; set; }
    public string Genre { get; set; } = string.Empty;
    public string Theme { get; set; } = string.Empty;
    public string? AudioBase64 { get; set; }
    public string? AudioType { get; set; }
    public string? Description { get; set; }
    public bool IsPublic { get; set; } = true;
    public Guid? ParentSongId { get; set; }
}