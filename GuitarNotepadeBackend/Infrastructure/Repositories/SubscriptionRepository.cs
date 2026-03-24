using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SubscriptionRepository : BaseRepository<Subscription>, ISubscriptionRepository
{
    public SubscriptionRepository(AppDbContext context) : base(context) { }

    public async Task<Subscription?> GetSubscriptionAsync(Guid userId, Guid targetId, bool isUserSub, CancellationToken cancellationToken = default)
    {
        if (isUserSub)
        {
            return await _dbSet
                .FirstOrDefaultAsync(s => s.UserId == userId && s.TargetUserId == targetId && s.IsUserSub == isUserSub, cancellationToken);
        }
        else
        {
            return await _dbSet
                .FirstOrDefaultAsync(s => s.UserId == userId && s.TargetAlbumId == targetId && s.IsUserSub == isUserSub, cancellationToken);
        }
    }

    public async Task<bool> ExistsAsync(Guid userId, Guid targetId, bool isUserSub, CancellationToken cancellationToken = default)
    {
        if (isUserSub)
        {
            return await _dbSet
                .AnyAsync(s => s.UserId == userId && s.TargetUserId == targetId && s.IsUserSub == isUserSub, cancellationToken);
        }
        else
        {
            return await _dbSet
                .AnyAsync(s => s.UserId == userId && s.TargetAlbumId == targetId && s.IsUserSub == isUserSub, cancellationToken);
        }
    }

    public async Task<List<Subscription>> GetUserSubscriptionsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.UserId == userId)
            .Include(s => s.TargetUser)
            .Include(s => s.TargetAlbum)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Subscription>> GetSubscribersAsync(Guid targetId, bool isUserSub, CancellationToken cancellationToken = default)
    {
        if (isUserSub)
        {
            return await _dbSet
                .Where(s => s.TargetUserId == targetId && s.IsUserSub == isUserSub)
                .Include(s => s.Subscriber)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync(cancellationToken);
        }
        else
        {
            return await _dbSet
                .Where(s => s.TargetAlbumId == targetId && s.IsUserSub == isUserSub)
                .Include(s => s.Subscriber)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync(cancellationToken);
        }
    }

    public async Task<int> CountUserSubscriptionsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.UserId == userId)
            .CountAsync(cancellationToken);
    }

    public async Task<int> CountSubscribersAsync(Guid targetId, bool isUserSub, CancellationToken cancellationToken = default)
    {
        if (isUserSub)
        {
            return await _dbSet
                .Where(s => s.TargetUserId == targetId && s.IsUserSub == isUserSub)
                .CountAsync(cancellationToken);
        }
        else
        {
            return await _dbSet
                .Where(s => s.TargetAlbumId == targetId && s.IsUserSub == isUserSub)
                .CountAsync(cancellationToken);
        }
    }
}