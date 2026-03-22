public class UpdateSongDto
{
    public string? Title { get; set; }
    public string? Artist { get; set; }
    public string? Genre { get; set; }
    public string? Theme { get; set; }
    public string? Description { get; set; }
    public bool? IsPublic { get; set; }
    public string? Key { get; set; }
    public string? Difficulty { get; set; }
    public string? AudioBase64 { get; set; }
    public string? AudioType { get; set; }
    public string? CustomAudioUrl { get; set; }
    public string? CustomAudioType { get; set; }
    public bool? IsDeleteAudio { get; set; }
}