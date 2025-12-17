using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface ISongReviewRepository : IBaseRepository<SongReview>
{
    Task<SongReview?> GetBySongAndUserAsync(Guid songId, Guid userId,
        CancellationToken cancellationToken = default);
    Task<List<SongReview>> GetBySongIdAsync(Guid songId,
        CancellationToken cancellationToken = default);
    Task<List<SongReview>> GetByUserIdAsync(Guid userId,
        CancellationToken cancellationToken = default);

    Task<List<SongReview>> GetLatestBySongIdAsync(Guid songId, int count,
        CancellationToken cancellationToken = default);
    Task<List<SongReview>> GetTopRatedBySongIdAsync(Guid songId, int count,
        CancellationToken cancellationToken = default);

    Task<bool> HasUserReviewedSongAsync(Guid userId, Guid songId,
        CancellationToken cancellationToken = default);

    Task<int> CountBySongIdAsync(Guid songId, CancellationToken cancellationToken = default);
    Task<int> CountByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
}