namespace Application.DTOs.Chords;

public class CreateChordDto
{
    public string Name { get; set; } = string.Empty;
    public string Fingering { get; set; } = string.Empty;
    public string? Description { get; set; }
}