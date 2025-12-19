using Domain.Common;
using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface ISongSegmentRepository : IBaseRepository<SongSegment>
{
    Task<List<SongSegment>> GetBySongIdAsync(
        Guid songId,
        CancellationToken cancellationToken = default);

    Task<List<SongSegment>> GetSegmentsByChordIdAsync(
        Guid chordId,
        CancellationToken cancellationToken = default);

    Task<List<SongSegment>> GetSegmentsByPatternIdAsync(
        Guid patternId,
        CancellationToken cancellationToken = default);

    Task<List<SongSegment>> GetSegmentsByTypeAsync(
        SegmentType type,
        Guid songId,
        CancellationToken cancellationToken = default);

    Task<SongSegment?> FindDuplicateAsync(
        string? lyric,
        Guid? chordId,
        Guid? patternId,
        CancellationToken cancellationToken = default);

    Task<List<SongSegment>> GetSegmentsWithLabelsAsync(
        List<Guid> labelIds,
        CancellationToken cancellationToken = default);

    Task<Dictionary<Guid, List<SongSegment>>> GetSegmentsGroupedBySongAsync(
        List<Guid> songIds,
        CancellationToken cancellationToken = default);
}
