namespace Application.DTOs.StrummingPatterns;

public class StrummingPatternsDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Pattern { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsFingerStyle { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedByNikName { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public StrummingPatternsDto() { }

    public StrummingPatternsDto(
    Guid id,
    string name,
    string pattern,
    string? description,
    bool isFingerStyle,
    Guid createdByUserId,
    DateTime createdAt,
    string? createdByNikName,
    DateTime? updatedAt
        )
    {
        Id = id;
        Name = name;
        Pattern = pattern;
        Description = description;
        IsFingerStyle = isFingerStyle;
        CreatedByUserId = createdByUserId;
        CreatedAt = createdAt;
        CreatedByNikName = createdByNikName;
        UpdatedAt = updatedAt;
    }
}
