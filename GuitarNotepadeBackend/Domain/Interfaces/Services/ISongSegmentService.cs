using Domain.Common;
using Domain.Entities;

namespace Domain.Interfaces.Services;

public interface ISongSegmentService
{
    Task<SongSegment> CreateSegmentAsync(
        SegmentType type,
        string? lyric = null,
        Guid? chordId = null,
        Guid? patternId = null,
        int? duration = null,
        string? description = null,
        string? color = null,
        string? backgroundColor = null,
        CancellationToken cancellationToken = default);

    Task<SongSegment> UpdateSegmentAsync(
        Guid segmentId,
        string? lyric = null,
        Guid? chordId = null,
        Guid? patternId = null,
        int? duration = null,
        string? description = null,
        string? color = null,
        string? backgroundColor = null,
        CancellationToken cancellationToken = default);

    Task<SongSegment> GetOrCreateSegmentAsync(
        List<SongSegment> existingSegments,
        SongStructure.SegmentData segmentData,
        CancellationToken cancellationToken = default);

    Task AddLabelToSegmentAsync(
        Guid segmentId,
        Guid labelId,
        CancellationToken cancellationToken = default);

    Task RemoveLabelFromSegmentAsync(
        Guid segmentId,
        Guid labelId,
        CancellationToken cancellationToken = default);

    Task<List<SongSegment>> GetSegmentsForSongAsync(
        Guid songId,
        CancellationToken cancellationToken = default);

    Task<Dictionary<string, List<SongSegment>>> GetSegmentsGroupedByRepeatAsync(
        Guid songId,
        CancellationToken cancellationToken = default);
}