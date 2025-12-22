using Domain.Common;

namespace Domain.Entities;

public class SongSegmentManager
{
    private readonly List<SongSegment> _existingSegments;

    public SongSegmentManager(List<SongSegment> existingSegments)
    {
        _existingSegments = existingSegments ?? new List<SongSegment>();
    }

    public SongSegment GetOrCreateSegment(SongStructure.SegmentData segmentData)
    {
        var duplicate = FindDuplicate(segmentData.Lyric, segmentData.ChordId, segmentData.PatternId);

        if (duplicate != null)
        {
            return duplicate;
        }

        var newSegment = SongSegment.Create(
            type: segmentData.Type,
            lyric: segmentData.Lyric,
            chordId: segmentData.ChordId,
            patternId: segmentData.PatternId,
            duration: segmentData.Duration,
            description: segmentData.Description,
            color: segmentData.Color,
            backgroundColor: segmentData.BackgroundColor);

        _existingSegments.Add(newSegment);
        return newSegment;
    }

    private SongSegment? FindDuplicate(string? lyric, Guid? chordId, Guid? patternId)
    {
        return SongSegment.FindDuplicate(_existingSegments, lyric, chordId, patternId);
    }
}
