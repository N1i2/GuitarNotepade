using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface IReviewLikeRepository : IBaseRepository<ReviewLike>
{
    Task<ReviewLike?> GetByReviewAndUserAsync(Guid reviewId, Guid userId,
        CancellationToken cancellationToken = default);
    Task<List<ReviewLike>> GetByReviewIdAsync(Guid reviewId,
        CancellationToken cancellationToken = default);
    Task<List<ReviewLike>> GetByUserIdAsync(Guid userId,
        CancellationToken cancellationToken = default);

    Task<int> CountLikesByReviewIdAsync(Guid reviewId,
        CancellationToken cancellationToken = default);
    Task<int> CountDislikesByReviewIdAsync(Guid reviewId,
        CancellationToken cancellationToken = default);

    Task<bool> HasUserLikedReviewAsync(Guid userId, Guid reviewId,
        CancellationToken cancellationToken = default);
}