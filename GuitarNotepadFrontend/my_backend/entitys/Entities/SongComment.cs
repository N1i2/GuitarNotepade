using Domain.Entities.Base;

namespace Domain.Entities;

public class SongComment : BaseEntityWithId
{
    public Guid SongId { get; private set; }
    public Guid? SegmentId { get; private set; }
    public string Text { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public virtual Song Song { get; private set; } = null!;
    public virtual SongSegment? Segment { get; private set; }

    protected SongComment()
    {
        Text = string.Empty;
    }

    public static SongComment Create(Guid songId, string text, Guid? segmentId = null)
    {
        if (songId == Guid.Empty)
            throw new ArgumentException("SongId is required", nameof(songId));

        if (string.IsNullOrWhiteSpace(text))
            throw new ArgumentException("Text is required", nameof(text));

        if (text.Length > 1000)
            throw new ArgumentException("Comment text is too long", nameof(text));

        return new SongComment
        {
            Id = Guid.NewGuid(),
            SongId = songId,
            SegmentId = segmentId,
            Text = text.Trim(),
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Update(string newText)
    {
        if (string.IsNullOrWhiteSpace(newText))
            throw new ArgumentException("Text is required", nameof(newText));

        if (newText.Length > 1000)
            throw new ArgumentException("Comment text is too long", nameof(newText));

        Text = newText.Trim();
    }
}