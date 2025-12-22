using Domain.Common;

namespace Domain.Entities;

public static class SongStructureService
{
    public static List<SongSegmentPosition> CreateSegmentPositions(
        SongStructure structure,
        List<(string? lyric, Guid? chordId, Guid? patternId, SegmentType type)> segmentData,
        Dictionary<int, string>? repeatGroups = null)
    {
        if (structure == null)
        {
            throw new ArgumentNullException(nameof(structure));
        }

        if (segmentData == null || !segmentData.Any())
        {
            return new List<SongSegmentPosition>();
        }

        var positions = new List<SongSegmentPosition>();
        var existingSegments = structure.GetSegmentsInOrder();
        var positionIndex = 0;

        foreach (var (lyric, chordId, patternId, type) in segmentData)
        {
            var existingSegment = SongSegment.FindDuplicate(existingSegments, lyric, chordId, patternId);

            SongSegment segment;
            if (existingSegment != null)
            {
                segment = existingSegment;
            }
            else
            {
                segment = SongSegment.Create(
                    type: type,
                    lyric: lyric,
                    chordId: chordId,
                    patternId: patternId);

                existingSegments.Add(segment);
            }

            string? repeatGroup = null;
            if (repeatGroups != null && repeatGroups.ContainsKey(positionIndex))
            {
                repeatGroup = repeatGroups[positionIndex];
            }

            var position = SongSegmentPosition.Create(
                songId: structure.SongId,
                segmentId: segment.Id,
                positionIndex: positionIndex,
                repeatGroup: repeatGroup);

            positions.Add(position);
            positionIndex++;
        }

        return positions;
    }
}
