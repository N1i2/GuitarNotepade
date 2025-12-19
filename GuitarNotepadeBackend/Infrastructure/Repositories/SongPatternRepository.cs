using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SongPatternRepository : BaseRepository<SongPattern>, ISongPatternRepository
{
    public SongPatternRepository(AppDbContext context) : base(context) { }

    public async Task<List<SongPattern>> GetBySongIdAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(sp => sp.SongId == songId)
            .Include(sp => sp.StrummingPattern)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SongPattern>> GetByPatternIdAsync(
        Guid patternId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(sp => sp.StrummingPatternId == patternId)
            .Include(sp => sp.Song)
            .ToListAsync(cancellationToken);
    }

    public async Task<SongPattern?> GetBySongAndPatternAsync(
        Guid songId,
        Guid patternId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(sp => sp.SongId == songId && sp.StrummingPatternId == patternId, cancellationToken);
    }

    public async Task<bool> ExistsAsync(
        Guid songId,
        Guid patternId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(sp => sp.SongId == songId && sp.StrummingPatternId == patternId, cancellationToken);
    }

    public async Task<int> CountByPatternIdAsync(
        Guid patternId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(sp => sp.StrummingPatternId == patternId)
            .CountAsync(cancellationToken);
    }

    public async Task<List<Guid>> GetPatternIdsForSongAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(sp => sp.SongId == songId)
            .Select(sp => sp.StrummingPatternId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Guid>> GetSongIdsForPatternAsync(
        Guid patternId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(sp => sp.StrummingPatternId == patternId)
            .Select(sp => sp.SongId)
            .Distinct()
            .ToListAsync(cancellationToken);
    }
}