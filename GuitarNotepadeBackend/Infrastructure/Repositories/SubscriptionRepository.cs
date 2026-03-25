using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SubscriptionRepository : BaseRepository<Subscription>, ISubscriptionRepository
{
    public SubscriptionRepository(AppDbContext context) : base(context) { }

    public async Task<Subscription?> GetSubscriptionAsync(Guid userId, Guid targetId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(s => s.UserId == userId && s.TargetAlbumId == targetId, cancellationToken);
    }

    public async Task<bool> ExistsAsync(Guid userId, Guid targetId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(s => s.UserId == userId && s.TargetAlbumId == targetId, cancellationToken);
    }

    public async Task<List<Subscription>> GetUserSubscriptionsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.UserId == userId)
            .Include(s => s.TargetAlbum)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Subscription>> GetSubscribersAsync(Guid targetId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.TargetAlbumId == targetId)
            .Include(s => s.Subscriber)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountUserSubscriptionsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.UserId == userId)
            .CountAsync(cancellationToken);
    }

    public async Task<int> CountSubscribersAsync(Guid targetId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.TargetAlbumId == targetId)
            .CountAsync(cancellationToken);
    }
}
