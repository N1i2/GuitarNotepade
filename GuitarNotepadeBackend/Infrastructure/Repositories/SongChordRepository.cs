using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SongChordRepository : BaseRepository<SongChord>, ISongChordRepository
{
    public SongChordRepository(AppDbContext context) : base(context) { }

    public async Task<List<SongChord>> GetBySongIdAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(sc => sc.SongId == songId)
            .Include(sc => sc.Chord)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SongChord>> GetByChordIdAsync(
        Guid chordId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(sc => sc.ChordId == chordId)
            .Include(sc => sc.Song)
            .ToListAsync(cancellationToken);
    }

    public async Task<SongChord?> GetBySongAndChordAsync(
        Guid songId,
        Guid chordId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(sc => sc.SongId == songId && sc.ChordId == chordId, cancellationToken);
    }

    public async Task<bool> ExistsAsync(
        Guid songId,
        Guid chordId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(sc => sc.SongId == songId && sc.ChordId == chordId, cancellationToken);
    }

    public async Task<int> CountByChordIdAsync(
        Guid chordId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(sc => sc.ChordId == chordId)
            .CountAsync(cancellationToken);
    }

    public async Task<List<Guid>> GetChordIdsForSongAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(sc => sc.SongId == songId)
            .Select(sc => sc.ChordId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Guid>> GetSongIdsForChordAsync(
        Guid chordId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(sc => sc.ChordId == chordId)
            .Select(sc => sc.SongId)
            .Distinct()
            .ToListAsync(cancellationToken);
    }
}