using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Domain.Common;

namespace Infrastructure.Repositories;

public class SongCommentRepository : BaseRepository<SongComment>, ISongCommentRepository
{
    public SongCommentRepository(AppDbContext context) : base(context) { }

    public async Task<List<SongComment>> GetBySongIdAsync(
        Guid songId,
        int page = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.SongId == songId)
            .OrderByDescending(c => c.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SongComment>> GetBySegmentIdAsync(
        Guid? segmentId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.SegmentId == segmentId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SongComment>> GetByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.UserId == userId)
            .Include(c => c.Song)
            .Include(c => c.Segment)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountBySongIdAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.SongId == songId)
            .CountAsync(cancellationToken);
    }

    public async Task<int> CountBySegmentIdAsync(
        Guid segmentId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.SegmentId == segmentId)
            .CountAsync(cancellationToken);
    }

    public async Task<bool> CanAddCommentToSongAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        var count = await CountBySongIdAsync(songId, cancellationToken);
        return count < Constants.Limits.MaxCommentsPerSong;
    }
}
