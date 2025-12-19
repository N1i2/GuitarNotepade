using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SongLabelRepository : BaseRepository<SongLabel>, ISongLabelRepository
{
    public SongLabelRepository(AppDbContext context) : base(context) { }

    public async Task<SongLabel?> GetByNameAsync(
        string name,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(l => l.Name == name, cancellationToken);
    }

    public async Task<List<SongLabel>> SearchByNameAsync(
        string searchTerm,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(l => l.Name.Contains(searchTerm))
            .OrderBy(l => l.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SongLabel>> GetLabelsForSegmentAsync(
        Guid segmentId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(l => l.SegmentLabels.Any(sl => sl.SegmentId == segmentId))
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SongLabel>> GetLabelsForSongAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(l => l.SegmentLabels.Any(sl => sl.Segment.Positions.Any(p => p.SongId == songId)))
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExistsByNameAsync(
        string name,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(l => l.Name == name, cancellationToken);
    }

    public async Task<Dictionary<Guid, List<SongLabel>>> GetLabelsForSegmentsAsync(
        List<Guid> segmentIds,
        CancellationToken cancellationToken = default)
    {
        var segmentLabels = await _dbSet
            .Where(l => l.SegmentLabels.Any(sl => segmentIds.Contains(sl.SegmentId)))
            .SelectMany(l => l.SegmentLabels)
            .Where(sl => segmentIds.Contains(sl.SegmentId))
            .Include(sl => sl.Label)
            .ToListAsync(cancellationToken);

        return segmentLabels
            .GroupBy(sl => sl.SegmentId)
            .ToDictionary(g => g.Key, g => g.Select(sl => sl.Label).Distinct().ToList());
    }
}