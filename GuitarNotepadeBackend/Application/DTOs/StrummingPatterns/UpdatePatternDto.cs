namespace Application.DTOs.StrummingPatterns;

public class UpdatePatternDto
{
    public string? Name { get; set; }
    public string? Pattern { get; set; }
    public bool? IsFingerStyle { get; set; }
    public string? Description { get; set; }
}