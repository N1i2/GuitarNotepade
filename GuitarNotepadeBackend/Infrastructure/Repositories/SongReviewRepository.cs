using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SongReviewRepository : BaseRepository<SongReview>, ISongReviewRepository
{
    public SongReviewRepository(AppDbContext context) : base(context) { }

    public async Task<SongReview?> GetBySongAndUserAsync(Guid songId, Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(r => r.SongId == songId && r.UserId == userId, cancellationToken);
    }

    public async Task<List<SongReview>> GetBySongIdAsync(Guid songId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(r => r.SongId == songId)
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SongReview>> GetByUserIdAsync(Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(r => r.UserId == userId)
            .Include(r => r.Song)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SongReview>> GetLatestBySongIdAsync(Guid songId, int count,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(r => r.SongId == songId)
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt)
            .Take(count)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SongReview>> GetTopRatedBySongIdAsync(Guid songId, int count,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(r => r.SongId == songId && r.BeautifulLevel.HasValue)
            .Include(r => r.User)
            .OrderByDescending(r => r.BeautifulLevel)
            .ThenByDescending(r => r.CreatedAt)
            .Take(count)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> HasUserReviewedSongAsync(Guid userId, Guid songId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(r => r.UserId == userId && r.SongId == songId, cancellationToken);
    }

    public async Task<int> CountBySongIdAsync(Guid songId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .CountAsync(r => r.SongId == songId, cancellationToken);
    }

    public async Task<int> CountByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .CountAsync(r => r.UserId == userId, cancellationToken);
    }
}