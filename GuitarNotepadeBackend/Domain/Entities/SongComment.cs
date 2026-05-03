using Domain.Common;
using Domain.Entities.Base;

namespace Domain.Entities;

public class SongComment : BaseEntityWithId
{
    public Guid UserId { get; private set; }
    public Guid SongId { get; private set; }
    public Guid? SegmentId { get; private set; }
    public string Text { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public virtual User User { get; private set; } = null!;
    public virtual Song Song { get; private set; } = null!;
    public virtual SongSegment? Segment { get; private set; }

    protected SongComment()
    {
        Text = string.Empty;
    }

    public static SongComment Create(Guid userId, Guid songId, string text, Guid? segmentId = null)
    {
        Guard.AgainstEmptyGuid(userId, nameof(userId));
        Guard.AgainstEmptyGuid(songId, nameof(songId));
        Guard.AgainstNullOrWhiteSpace(text, nameof(text), "Text is required");

        if (text.Length > Constants.Limits.MaxCommentTextLength)
        {
            throw new ArgumentException("Comment text is too long", nameof(text));
        }

        return new SongComment
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SongId = songId,
            SegmentId = segmentId,
            Text = text.Trim(),
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Update(string newText)
    {
        Guard.AgainstNullOrWhiteSpace(newText, nameof(newText), "Text is required");

        if (newText.Length > Constants.Limits.MaxCommentTextLength)
        {
            throw new ArgumentException("Comment text is too long", nameof(newText));
        }

        Text = newText.Trim();
    }
}
