public class CreateSongCommentDto
{
    public string Text { get; set; } = string.Empty;
    public Guid? SegmentId { get; set; }
}