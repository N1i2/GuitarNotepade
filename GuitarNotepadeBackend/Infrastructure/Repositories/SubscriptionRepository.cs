using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SubscriptionRepository : BaseRepository<Subscription>, ISubscriptionRepository
{
    public SubscriptionRepository(AppDbContext context) : base(context) { }

    public async Task<Subscription?> GetSubscriptionAsync(Guid userId, Guid subId, bool isUserSub, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(s => s.UserId == userId && s.TargetId == subId && s.IsUserSub == isUserSub, cancellationToken);
    }

    public async Task<bool> ExistsAsync(Guid userId, Guid subId, bool isUserSub, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(s => s.UserId == userId && s.TargetId == subId && s.IsUserSub == isUserSub, cancellationToken);
    }

    public async Task<List<Subscription>> GetUserSubscriptionsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Subscription>> GetSubscribersAsync(Guid subId, bool isUserSub, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.TargetId == subId && s.IsUserSub == isUserSub)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountUserSubscriptionsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.UserId == userId)
            .CountAsync(cancellationToken);
    }

    public async Task<int> CountSubscribersAsync(Guid subId, bool isUserSub, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.TargetId == subId && s.IsUserSub == isUserSub)
            .CountAsync(cancellationToken);
    }
}
