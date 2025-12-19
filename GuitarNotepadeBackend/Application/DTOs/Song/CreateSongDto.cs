public class CreateSongDto
{
    public string Title { get; set; } = string.Empty;
    public string? Artist { get; set; }
    public string? Description { get; set; }
    public bool IsPublic { get; set; } = true;
    public Guid? ParentSongId { get; set; }
    public string? Key { get; set; }
    public string? Difficulty { get; set; }
}