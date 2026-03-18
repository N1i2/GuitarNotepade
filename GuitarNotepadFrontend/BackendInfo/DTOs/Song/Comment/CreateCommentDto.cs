namespace Application.DTOs.Song.Comment;

public class CreateCommentDto
{
    public string Text { get; set; } = string.Empty;
    public Guid? SegmentId { get; set; }
}
