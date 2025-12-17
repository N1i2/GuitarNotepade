using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SongRepository : BaseRepository<Song>, ISongRepository
{
    public SongRepository(AppDbContext context) : base(context) { }

    public async Task<List<Song>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.OwnerId == userId)
            .Include(s => s.SongChords).ThenInclude(sc => sc.Chord)
            .Include(s => s.SongPatterns).ThenInclude(sp => sp.StrummingPattern)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Song>> GetPublicSongsAsync(int page, int pageSize, string? searchTerm = null,
        string? sortBy = null, bool descending = false, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.Where(s => s.IsPublic);

        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(s =>
                s.Title.Contains(searchTerm) ||
                s.FullText.Contains(searchTerm) ||
                (s.Artist != null && s.Artist.Contains(searchTerm)));
        }

        query = sortBy?.ToLower() switch
        {
            "title" => descending ? query.OrderByDescending(s => s.Title) : query.OrderBy(s => s.Title),
            "updatedat" => descending ? query.OrderByDescending(s => s.UpdatedAt) : query.OrderBy(s => s.UpdatedAt),
            "createdat" => descending ? query.OrderByDescending(s => s.CreatedAt) : query.OrderBy(s => s.CreatedAt),
            _ => query.OrderByDescending(s => s.CreatedAt)
        };

        return await query
            .Include(s => s.Owner)
            .Include(s => s.SongChords).ThenInclude(sc => sc.Chord)
            .Include(s => s.SongPatterns).ThenInclude(sp => sp.StrummingPattern)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<Song?> GetByTitleAndOwnerAsync(string title, Guid ownerId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(s => s.SongChords).ThenInclude(sc => sc.Chord)
            .Include(s => s.SongPatterns).ThenInclude(sp => sp.StrummingPattern)
            .FirstOrDefaultAsync(s => s.Title == title && s.OwnerId == ownerId, cancellationToken);
    }

    public async Task<List<Song>> SearchAsync(string searchTerm, int page, int pageSize,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.IsPublic &&
                (s.Title.Contains(searchTerm) ||
                 s.FullText.Contains(searchTerm) ||
                 (s.Artist != null && s.Artist.Contains(searchTerm))))
            .Include(s => s.Owner)
            .Include(s => s.SongChords).ThenInclude(sc => sc.Chord)
            .Include(s => s.SongPatterns).ThenInclude(sp => sp.StrummingPattern)
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Song>> SearchByChordAsync(Guid chordId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.IsPublic &&
                s.SongChords.Any(sc => sc.ChordId == chordId))
            .Include(s => s.Owner)
            .Include(s => s.SongChords).ThenInclude(sc => sc.Chord)
            .Include(s => s.SongPatterns).ThenInclude(sp => sp.StrummingPattern)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Song>> SearchByPatternAsync(Guid patternId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.IsPublic &&
                s.SongPatterns.Any(sp => sp.StrummingPatternId == patternId))
            .Include(s => s.Owner)
            .Include(s => s.SongChords).ThenInclude(sc => sc.Chord)
            .Include(s => s.SongPatterns).ThenInclude(sp => sp.StrummingPattern)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Song>> GetByParentIdAsync(Guid parentSongId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.ParentSongId == parentSongId)
            .Include(s => s.Owner)
            .Include(s => s.SongChords).ThenInclude(sc => sc.Chord)
            .Include(s => s.SongPatterns).ThenInclude(sp => sp.StrummingPattern)
            .ToListAsync(cancellationToken);
    }

    public override async Task<Song?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(s => s.Owner)
            .Include(s => s.SongChords).ThenInclude(sc => sc.Chord)
            .Include(s => s.SongPatterns).ThenInclude(sp => sp.StrummingPattern)
            .Include(s => s.Reviews).ThenInclude(r => r.User)
            .Include(s => s.ChildSongs)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<int> CountPublicSongsAsync(string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet.Where(s => s.IsPublic);

        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(s =>
                s.Title.Contains(searchTerm) ||
                s.FullText.Contains(searchTerm) ||
                (s.Artist != null && s.Artist.Contains(searchTerm)));
        }

        return await query.CountAsync(cancellationToken);
    }

    public async Task<int> CountByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .CountAsync(s => s.OwnerId == userId, cancellationToken);
    }
}