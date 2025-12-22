using Domain.Entities.Base;

namespace Domain.Entities;

public class SegmentLabel : BaseEntityWithId
{
    public Guid SegmentId { get; private set; }
    public Guid LabelId { get; private set; }

    public virtual SongSegment Segment { get; private set; } = null!;
    public virtual SongLabel Label { get; private set; } = null!;

    protected SegmentLabel() { }

    public static SegmentLabel Create(Guid segmentId, Guid labelId)
    {
        if (segmentId == Guid.Empty)
            throw new ArgumentException("SegmentId is required", nameof(segmentId));

        if (labelId == Guid.Empty)
            throw new ArgumentException("LabelId is required", nameof(labelId));

        return new SegmentLabel
        {
            Id = Guid.NewGuid(),
            SegmentId = segmentId,
            LabelId = labelId
        };
    }
}
