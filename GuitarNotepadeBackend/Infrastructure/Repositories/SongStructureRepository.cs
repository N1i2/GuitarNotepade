using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SongStructureRepository : BaseRepository<SongStructure>, ISongStructureRepository
{
    public SongStructureRepository(AppDbContext context) : base(context) { }

    public async Task<SongStructure?> GetBySongIdAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(ss => ss.SongId == songId, cancellationToken);
    }

    public async Task<SongStructure?> GetWithSegmentsAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(ss => ss.SegmentPositions)
                .ThenInclude(sp => sp.Segment)
                    .ThenInclude(s => s.Chord)
            .Include(ss => ss.SegmentPositions)
                .ThenInclude(sp => sp.Segment)
                    .ThenInclude(s => s.Pattern)
            .FirstOrDefaultAsync(ss => ss.SongId == songId, cancellationToken);
    }

    public async Task<List<SongStructure>> GetStructuresWithSegmentsAsync(
        List<Guid> songIds,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(ss => songIds.Contains(ss.SongId))
            .Include(ss => ss.SegmentPositions)
                .ThenInclude(sp => sp.Segment)
            .ToListAsync(cancellationToken);
    }
}
