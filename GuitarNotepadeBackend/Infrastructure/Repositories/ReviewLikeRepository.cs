using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class ReviewLikeRepository : BaseRepository<ReviewLike>, IReviewLikeRepository
{
    public ReviewLikeRepository(AppDbContext context) : base(context) { }

    public async Task<ReviewLike?> GetByReviewAndUserAsync(Guid reviewId, Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(rl => rl.ReviewId == reviewId && rl.UserId == userId, cancellationToken);
    }

    public async Task<List<ReviewLike>> GetByReviewIdAsync(Guid reviewId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(rl => rl.ReviewId == reviewId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ReviewLike>> GetByUserIdAsync(Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(rl => rl.UserId == userId)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountLikesByReviewIdAsync(Guid reviewId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .CountAsync(rl => rl.ReviewId == reviewId && rl.IsLike, cancellationToken);
    }

    public async Task<int> CountDislikesByReviewIdAsync(Guid reviewId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .CountAsync(rl => rl.ReviewId == reviewId && !rl.IsLike, cancellationToken);
    }

    public async Task<bool> HasUserLikedReviewAsync(Guid userId, Guid reviewId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(rl => rl.UserId == userId && rl.ReviewId == reviewId, cancellationToken);
    }
}