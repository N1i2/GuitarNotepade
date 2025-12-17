namespace Application.DTOs.Songs;

public class SongLabelDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
}