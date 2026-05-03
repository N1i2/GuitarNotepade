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
        Guard.AgainstEmptyGuid(songId, nameof(songId));

        return new SongStructure
        {
            Id = Guid.NewGuid(),
            SongId = songId
        };
    }

    public void BuildStructure(
        Guid songId,
        List<(Guid segmentId, string? repeatGroup)> segmentPositions)
    {
        if (segmentPositions == null)
            throw new ArgumentNullException(nameof(segmentPositions));

        SegmentPositions.Clear();

        var positionIndex = 0;
        foreach (var (segmentId, repeatGroup) in segmentPositions)
        {
            var position = SongSegmentPosition.Create(
                songId: songId,
                segmentId: segmentId,
                positionIndex: positionIndex,
                repeatGroup: repeatGroup);

            SegmentPositions.Add(position);
            positionIndex++;
        }
    }

    public void AddSegmentAtPosition(
        Guid songId,
        Guid segmentId,
        int positionIndex,
        string? repeatGroup = null)
    {
        if (!CanAddPosition())
            throw new InvalidOperationException($"Cannot add more than {Constants.Limits.MaxSegmentPositionsPerSong} segment positions");

        if (positionIndex < 0 || positionIndex > SegmentPositions.Count)
            throw new ArgumentException("Invalid position index", nameof(positionIndex));

        foreach (var pos in SegmentPositions.Where(p => p.PositionIndex >= positionIndex))
        {
            pos.UpdatePosition(pos.PositionIndex + 1);
        }

        var position = SongSegmentPosition.Create(
            songId: songId,
            segmentId: segmentId,
            positionIndex: positionIndex,
            repeatGroup: repeatGroup);

        SegmentPositions.Add(position);
    }

    public void ReplaceSegmentAtPosition(int positionIndex, Guid newSegmentId)
    {
        var position = SegmentPositions.FirstOrDefault(p => p.PositionIndex == positionIndex);
        if (position == null)
            throw new ArgumentException($"No segment at position {positionIndex}");

        position.SetSegment(newSegmentId);
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
