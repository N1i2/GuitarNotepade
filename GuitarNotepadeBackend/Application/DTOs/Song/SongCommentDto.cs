public class SongCommentDto
{
    public Guid Id { get; set; }
    public Guid SongId { get; set; }
    public Guid? SegmentId { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public Guid? AuthorId { get; set; }
    public string? AuthorName { get; set; }
    public string? AuthorAvatar { get; set; }
}
