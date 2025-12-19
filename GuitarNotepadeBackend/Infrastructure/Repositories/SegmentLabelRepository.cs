using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SegmentLabelRepository : BaseRepository<SegmentLabel>, ISegmentLabelRepository
{
    public SegmentLabelRepository(AppDbContext context) : base(context) { }

    public async Task<SegmentLabel?> GetBySegmentAndLabelAsync(
        Guid segmentId,
        Guid labelId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(sl => sl.SegmentId == segmentId && sl.LabelId == labelId, cancellationToken);
    }

    public async Task<List<SegmentLabel>> GetBySegmentIdAsync(
        Guid segmentId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(sl => sl.SegmentId == segmentId)
            .Include(sl => sl.Label)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SegmentLabel>> GetByLabelIdAsync(
        Guid labelId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(sl => sl.LabelId == labelId)
            .Include(sl => sl.Segment)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SegmentLabel>> GetBySongIdAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(sl => sl.Segment.Positions.Any(p => p.SongId == songId))
            .Include(sl => sl.Label)
            .Include(sl => sl.Segment)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExistsAsync(
        Guid segmentId,
        Guid labelId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(sl => sl.SegmentId == segmentId && sl.LabelId == labelId, cancellationToken);
    }

    public async Task<int> CountByLabelIdAsync(
        Guid labelId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(sl => sl.LabelId == labelId)
            .CountAsync(cancellationToken);
    }

    public async Task DeleteBySegmentAndLabelAsync(
        Guid segmentId,
        Guid labelId,
        CancellationToken cancellationToken = default)
    {
        var segmentLabel = await GetBySegmentAndLabelAsync(segmentId, labelId, cancellationToken);
        if (segmentLabel != null)
        {
            _dbSet.Remove(segmentLabel);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}