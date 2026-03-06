using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface ISongCommentRepository : IBaseRepository<SongComment>
{
    Task<List<SongComment>> GetBySongIdAsync(
        Guid songId,
        int page = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default);

    Task<List<SongComment>> GetBySegmentIdAsync(
        Guid? segmentId,
        CancellationToken cancellationToken = default);

    Task<List<SongComment>> GetByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<int> CountBySongIdAsync(
        Guid songId,
        CancellationToken cancellationToken = default);

    Task<int> CountBySegmentIdAsync(
        Guid segmentId,
        CancellationToken cancellationToken = default);

    Task<bool> CanAddCommentToSongAsync(
        Guid songId,
        CancellationToken cancellationToken = default);
}
