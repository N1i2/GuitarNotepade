using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SongSegmentPositionRepository : BaseRepository<SongSegmentPosition>, ISongSegmentPositionRepository
{
    public SongSegmentPositionRepository(AppDbContext context) : base(context) { }

    public async Task<List<SongSegmentPosition>> GetBySongIdAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.SongId == songId)
            .Include(p => p.Segment)
            .OrderBy(p => p.PositionIndex)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SongSegmentPosition>> GetBySegmentIdAsync(
        Guid segmentId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.SegmentId == segmentId)
            .Include(p => p.Song)
            .OrderBy(p => p.PositionIndex)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SongSegmentPosition>> GetBySongIdOrderedAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.SongId == songId)
            .Include(p => p.Segment)
                .ThenInclude(s => s.Chord)
            .Include(p => p.Segment)
                .ThenInclude(s => s.Pattern)
            .OrderBy(p => p.PositionIndex)
            .ToListAsync(cancellationToken);
    }

    public async Task<Dictionary<int, SongSegmentPosition>> GetPositionsMapAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        var positions = await GetBySongIdOrderedAsync(songId, cancellationToken);
        return positions.ToDictionary(p => p.PositionIndex, p => p);
    }

    public async Task<int> GetMaxPositionIndexAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.SongId == songId)
            .MaxAsync(p => (int?)p.PositionIndex, cancellationToken) ?? -1;
    }

    public async Task<bool> HasPositionAtIndexAsync(
        Guid songId,
        int positionIndex,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(p => p.SongId == songId && p.PositionIndex == positionIndex, cancellationToken);
    }

    public async Task UpdatePositionsAfterIndexAsync(
        Guid songId,
        int fromIndex,
        int increment,
        CancellationToken cancellationToken = default)
    {
        var positions = await _dbSet
            .Where(p => p.SongId == songId && p.PositionIndex >= fromIndex)
            .ToListAsync(cancellationToken);

        foreach (var position in positions)
        {
            position.UpdatePosition(position.PositionIndex + increment);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> DeletePositionWithSegmentIfUnusedAsync(
    Guid positionId,
    CancellationToken cancellationToken = default)
    {
        var position = await _dbSet
            .Include(p => p.Segment)
            .FirstOrDefaultAsync(p => p.Id == positionId, cancellationToken);

        if (position == null)
            return false;

        var segment = position.Segment;
        var songId = position.SongId;

        _dbSet.Remove(position);

        var remainingPositionsInThisSong = await _dbSet
            .AnyAsync(p => p.SegmentId == segment.Id &&
                          p.SongId == songId &&
                          p.Id != positionId,
                          cancellationToken);

        if (!remainingPositionsInThisSong)
        {
            _context.SongSegments.Remove(segment);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
