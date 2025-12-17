using Domain.Entities.HelpEntitys;

namespace Application.DTOs.Songs;

public class SongDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Artist { get; set; }
    public bool IsPublic { get; set; }
    public Guid OwnerId { get; set; }
    public string? OwnerName { get; set; }
    public Guid? ParentSongId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public SongStructureDto? Structure { get; set; }
    public List<Guid> ChordIds { get; set; } = new();
    public List<Guid> PatternIds { get; set; } = new();
    public int ReviewCount { get; set; }
    public double? AverageRating { get; set; }
}
