using Domain.Common;
using Domain.Entities.Base;

namespace Domain.Entities;

public class SongStructure : BaseEntityWithId
{
    public Guid SongId { get; private set; }

    public virtual ICollection<SongSegmentPosition> SegmentPositions { get; private set; }

    public virtual Song Song { get; private set; } = null!;

    protected SongStructure()
    {
        SegmentPositions = new List<SongSegmentPosition>();
    }

    public static SongStructure Create(Guid songId)
    {
        if (songId == Guid.Empty)
            throw new ArgumentException("SongId is required", nameof(songId));

        return new SongStructure
        {
            Id = Guid.NewGuid(),
            SongId = songId
        };
    }

    public void BuildStructure(
            List<SegmentData> segmentDataList,
            Dictionary<int, string>? repeatGroups = null)
    {
        if (segmentDataList == null || !segmentDataList.Any())
            return;

        SegmentPositions.Clear();

        var existingSegments = new List<SongSegment>();
        var segmentManager = new SongSegmentManager(existingSegments);
        var positionIndex = 0;

        foreach (var segmentData in segmentDataList)
        {
            var segment = segmentManager.GetOrCreateSegment(segmentData);

            string? repeatGroup = null;
            if (repeatGroups != null && repeatGroups.ContainsKey(positionIndex))
            {
                repeatGroup = repeatGroups[positionIndex];
            }

            var position = SongSegmentPosition.Create(
                songId: SongId,
                segmentId: segment.Id,
                positionIndex: positionIndex,
                repeatGroup: repeatGroup);

            SegmentPositions.Add(position);
            positionIndex++;
        }
    }

    public void AddSegmentAtPosition(
        int positionIndex,
        SegmentData segmentData,
        string? repeatGroup = null)
    {
        if (!CanAddPosition())
            throw new InvalidOperationException($"Cannot add more than {Constants.Limits.MaxSegmentPositionsPerSong} segment positions");

        if (positionIndex < 0 || positionIndex > SegmentPositions.Count)
            throw new ArgumentException("Invalid position index", nameof(positionIndex));

        var allSegments = GetSegmentsInOrder();
        var segmentManager = new SongSegmentManager(allSegments);
        var segment = segmentManager.GetOrCreateSegment(segmentData);

        foreach (var pos in SegmentPositions.Where(p => p.PositionIndex >= positionIndex))
        {
            pos.UpdatePosition(pos.PositionIndex + 1);
        }

        var position = SongSegmentPosition.Create(
            songId: SongId,
            segmentId: segment.Id,
            positionIndex: positionIndex,
            repeatGroup: repeatGroup);

        SegmentPositions.Add(position);
    }

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

    public List<SongSegment> GetSegmentsInOrder()
    {
        return SegmentPositions
            .OrderBy(sp => sp.PositionIndex)
            .Select(sp => sp.Segment)
            .Where(s => s != null)
            .ToList();
    }

    public List<string> GetAllSegmentLyrics()
    {
        return GetSegmentsInOrder()
            .Where(s => !string.IsNullOrEmpty(s.Lyric))
            .Select(s => s.Lyric!)
            .Distinct()
            .ToList();
    }

    public Dictionary<string, List<SongSegment>> GetSegmentsGroupedByRepeat()
    {
        return SegmentPositions
            .Where(sp => !string.IsNullOrEmpty(sp.RepeatGroup))
            .GroupBy(sp => sp.RepeatGroup!)
            .ToDictionary(g => g.Key, g => g.Select(sp => sp.Segment).ToList());
    }

    public void RemoveSegmentAtPosition(int positionIndex)
    {
        var position = SegmentPositions.FirstOrDefault(p => p.PositionIndex == positionIndex);
        if (position == null)
            return;

        SegmentPositions.Remove(position);

        foreach (var pos in SegmentPositions.Where(p => p.PositionIndex > positionIndex))
        {
            pos.UpdatePosition(pos.PositionIndex - 1);
        }
    }

    public void MoveSegment(int fromPosition, int toPosition)
    {
        var positions = SegmentPositions.OrderBy(p => p.PositionIndex).ToList();

        if (fromPosition < 0 || fromPosition >= positions.Count ||
            toPosition < 0 || toPosition >= positions.Count)
            throw new ArgumentException("Invalid position index");

        if (fromPosition == toPosition)
            return;

        var segmentToMove = positions[fromPosition];
        positions.RemoveAt(fromPosition);
        positions.Insert(toPosition, segmentToMove);

        for (int i = 0; i < positions.Count; i++)
        {
            positions[i].UpdatePosition(i);
        }
    }

    private bool CanAddPosition()
    {
        return SegmentPositions.Count < Constants.Limits.MaxSegmentPositionsPerSong;
    }

    public record SegmentData(
        SegmentType Type,
        string? Lyric,
        Guid? ChordId,
        Guid? PatternId,
        int? Duration = null,
        string? Description = null,
        string? Color = null,
        string? BackgroundColor = null);
}
