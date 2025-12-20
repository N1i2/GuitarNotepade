using Domain.Entities.Base;

namespace Domain.Entities;

public class SongSegmentPosition : BaseEntityWithId
{
    public Guid SongId { get; private set; }
    public Guid SegmentId { get; private set; }
    public int PositionIndex { get; private set; }
    public string? RepeatGroup { get; private set; }

    public virtual Song Song { get; private set; } = null!;
    public virtual SongSegment Segment { get; private set; } = null!;
    public virtual SongStructure SongStructure { get; private set; } = null!;

    protected SongSegmentPosition() { }

    public static SongSegmentPosition Create(
        Guid songId,
        Guid segmentId,
        int positionIndex,
        string? repeatGroup = null)
    {
        if (songId == Guid.Empty)
        {
            throw new ArgumentException("SongId is required", nameof(songId));
        }


        if (segmentId == Guid.Empty)
        {
            throw new ArgumentException("SegmentId is required", nameof(segmentId));
        }

        if (positionIndex < 0)
        {
            throw new ArgumentException("PositionIndex cannot be negative", nameof(positionIndex));
        }

        return new SongSegmentPosition
        {
            Id = Guid.NewGuid(),
            SongId = songId,
            SegmentId = segmentId,
            PositionIndex = positionIndex,
            RepeatGroup = repeatGroup
        };
    }

    public void UpdatePosition(int newPositionIndex, string? repeatGroup = null)
    {
        if (newPositionIndex < 0)
        {
            throw new ArgumentException("PositionIndex cannot be negative", nameof(newPositionIndex));
        }

        PositionIndex = newPositionIndex;
        RepeatGroup = repeatGroup;
    }
}