using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface ISongSegmentPositionRepository : IBaseRepository<SongSegmentPosition>
{
    Task<List<SongSegmentPosition>> GetBySongIdAsync(
        Guid songId,
        CancellationToken cancellationToken = default);

    Task<List<SongSegmentPosition>> GetBySegmentIdAsync(
        Guid segmentId,
        CancellationToken cancellationToken = default);

    Task<List<SongSegmentPosition>> GetBySongIdOrderedAsync(
        Guid songId,
        CancellationToken cancellationToken = default);

    Task<Dictionary<int, SongSegmentPosition>> GetPositionsMapAsync(
        Guid songId,
        CancellationToken cancellationToken = default);

    Task<int> GetMaxPositionIndexAsync(
        Guid songId,
        CancellationToken cancellationToken = default);

    Task<bool> HasPositionAtIndexAsync(
        Guid songId,
        int positionIndex,
        CancellationToken cancellationToken = default);

    Task UpdatePositionsAfterIndexAsync(
        Guid songId,
        int fromIndex,
        int increment,
        CancellationToken cancellationToken = default);
}