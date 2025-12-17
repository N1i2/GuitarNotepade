namespace Domain.Entities.HelpEntitys;

public class SongComment
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public Guid AuthorId { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? SegmentId { get; set; }
    public int? CharacterPosition { get; set; }

    public string? ParentCommentId { get; set; }
}