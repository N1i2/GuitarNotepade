using Domain.Common;
using Domain.Entities.Base;
using System.Text;

namespace Domain.Entities;

public class SongSegment : BaseEntityWithId
{
    public SegmentType Type { get; private set; }
    public string? Lyric { get; private set; }
    public int? Duration { get; private set; }
    public string? Description { get; private set; }

    public Guid? ChordId { get; private set; }
    public Guid? PatternId { get; private set; }

    public string? Color { get; private set; }
    public string? BackgroundColor { get; private set; }

    public string ContentHash { get; private set; }

    public virtual Chord? Chord { get; private set; }
    public virtual StrummingPattern? Pattern { get; private set; }
    public virtual ICollection<SongSegmentPosition> Positions { get; private set; }
    public virtual ICollection<SongComment> Comments { get; private set; }

    protected SongSegment()
    {
        ContentHash = string.Empty;
        Positions = new List<SongSegmentPosition>();
        Comments = new List<SongComment>();
    }

    public static SongSegment Create(
        SegmentType type,
        string? lyric = null,
        Guid? chordId = null,
        Guid? patternId = null,
        int? duration = null,
        string? description = null,
        string? color = null,
        string? backgroundColor = null)
    {
        var segment = new SongSegment
        {
            Id = Guid.NewGuid(),
            Type = type,
            Lyric = lyric?.Trim(),
            ChordId = chordId,
            PatternId = patternId,
            Duration = duration,
            Description = description?.Trim(),
            Color = color,
            BackgroundColor = backgroundColor
        };

        segment.ContentHash = ComputeContentHash(segment.Lyric, segment.ChordId, segment.PatternId);
        return segment;
    }

    public void Update(
        string? lyric = null,
        Guid? chordId = null,
        Guid? patternId = null,
        int? duration = null,
        string? description = null,
        string? color = null,
        string? backgroundColor = null)
    {
        if (lyric != null) Lyric = lyric.Trim();
        if (chordId.HasValue) ChordId = chordId;
        if (patternId.HasValue) PatternId = patternId;
        if (duration.HasValue) Duration = duration;
        if (description != null) Description = description.Trim();
        if (color != null) Color = color;
        if (backgroundColor != null) BackgroundColor = backgroundColor;

        ContentHash = ComputeContentHash(Lyric, ChordId, PatternId);
    }

    private static string ComputeContentHash(string? lyric, Guid? chordId, Guid? patternId)
    {
        var hashBuilder = new StringBuilder();
        hashBuilder.Append(lyric ?? string.Empty);
        hashBuilder.Append('|');
        hashBuilder.Append(chordId?.ToString() ?? string.Empty);
        hashBuilder.Append('|');
        hashBuilder.Append(patternId?.ToString() ?? string.Empty);

        return hashBuilder.ToString().GetHashCode().ToString("X");
    }

    public static SongSegment? FindDuplicate(
        IEnumerable<SongSegment> existingSegments,
        string? lyric,
        Guid? chordId,
        Guid? patternId)
    {
        var targetHash = CalculateContentHash(lyric, chordId, patternId);
        return existingSegments.FirstOrDefault(s => s.ContentHash == targetHash);
    }

    public static string CalculateContentHash(string? lyric, Guid? chordId, Guid? patternId)
    {
        return ComputeContentHash(lyric, chordId, patternId);
    }
}
