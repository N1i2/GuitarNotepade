namespace Application.DTOs.Chords;

public class ChordDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Fingering { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string? CreatedByNikName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public ChordDto() { }

    public ChordDto(
        Guid id,
        string name,
        string fingering,
        string? description,
        Guid createdByUserId,
        string? createdByNikName,
        DateTime createdAt,
        DateTime? updatedAt)
    {
        Id = id;
        Name = name;
        Fingering = fingering;
        Description = description;
        CreatedByUserId = createdByUserId;
        CreatedByNikName = createdByNikName;
        CreatedAt = createdAt;
        UpdatedAt = updatedAt;
    }
}