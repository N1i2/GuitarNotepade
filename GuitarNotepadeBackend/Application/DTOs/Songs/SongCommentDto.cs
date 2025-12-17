namespace Application.DTOs.Songs;

public class SongCommentDto
{
    public Guid Id { get; set; }
    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? SegmentId { get; set; }
    public Guid? ParentCommentId { get; set; }
}

