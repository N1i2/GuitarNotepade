using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Repositories;

public class SongRepository : BaseRepository<Song>, ISongRepository
{
    private readonly ILogger<SongRepository> _logger;

    public SongRepository(
        AppDbContext context,
        ILogger<SongRepository> logger) : base(context)
    {
        _logger = logger;
    }

    public async Task<List<Song>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.OwnerId == userId)
            .Include(s => s.Structure)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Song>> GetPublicSongsAsync(int page, int pageSize, string? searchTerm = null,
        string? sortBy = null, bool descending = false, CancellationToken cancellationToken = default)
    {
        IQueryable<Song> query = ApplyPublicTextSearch(_dbSet.Where(s => s.IsPublic), searchTerm);
        query = query
            .Include(s => s.Owner)
            .Include(s => s.Structure);

        query = ApplySorting(query, sortBy, descending);

        return await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<Song?> GetByTitleAndOwnerAsync(string title, Guid ownerId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(s => s.Title == title && s.OwnerId == ownerId, cancellationToken);
    }

    public async Task<List<Song>> SearchAsync(string searchTerm, int page, int pageSize,
        CancellationToken cancellationToken = default)
    {
        searchTerm = searchTerm.ToLower();

        return await _dbSet
            .Where(s => s.IsPublic && (
                s.FullText.ToLower().Contains(searchTerm) ||
                s.Title.ToLower().Contains(searchTerm) ||
                (s.Artist != null && s.Artist.ToLower().Contains(searchTerm))))
            .Include(s => s.Owner)
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Song>> SearchByChordAsync(Guid chordId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.IsPublic && s.SongChords.Any(sc => sc.ChordId == chordId))
            .Include(s => s.Owner)
            .Include(s => s.Structure)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Song>> SearchByPatternAsync(Guid patternId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.IsPublic && s.SongPatterns.Any(sp => sp.StrummingPatternId == patternId))
            .Include(s => s.Owner)
            .Include(s => s.Structure)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Song>> GetByParentIdAsync(Guid parentSongId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.ParentSongId == parentSongId && s.IsPublic)
            .Include(s => s.Owner)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountPublicSongsAsync(string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        var query = ApplyPublicTextSearch(_dbSet.Where(s => s.IsPublic), searchTerm);
        return await query.CountAsync(cancellationToken);
    }

    public async Task<int> CountByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.OwnerId == userId)
            .CountAsync(cancellationToken);
    }

    private static IQueryable<Song> ApplyPublicTextSearch(IQueryable<Song> query, string? searchTerm)
    {
        if (string.IsNullOrEmpty(searchTerm))
        {
            return query;
        }

        var term = searchTerm.ToLower();
        return query.Where(s =>
            s.FullText.ToLower().Contains(term) ||
            s.Title.ToLower().Contains(term) ||
            (s.Artist != null && s.Artist.ToLower().Contains(term)));
    }

    private IQueryable<Song> ApplySorting(IQueryable<Song> query, string? sortBy, bool descending)
    {
        return (sortBy?.ToLower(), descending) switch
        {
            ("title", false) => query.OrderBy(s => s.Title),
            ("title", true) => query.OrderByDescending(s => s.Title),
            ("createdat", false) => query.OrderBy(s => s.CreatedAt),
            ("createdat", true) => query.OrderByDescending(s => s.CreatedAt),
            ("updatedat", false) => query.OrderBy(s => s.UpdatedAt ?? s.CreatedAt),
            ("updatedat", true) => query.OrderByDescending(s => s.UpdatedAt ?? s.CreatedAt),
            ("reviews", false) => query.OrderBy(s => s.ReviewCount),
            ("reviews", true) => query.OrderByDescending(s => s.ReviewCount),
            _ => query.OrderByDescending(s => s.CreatedAt)
        };
    }

    public override async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var song = await _dbSet
                .Include(s => s.SongChords)
                .Include(s => s.SongPatterns)
                .Include(s => s.Comments)
                .Include(s => s.Reviews)
                .Include(s => s.ChildSongs)
                .Include(s => s.SegmentPositions)
                    .ThenInclude(sp => sp.Segment)
                .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

            if (song == null)
            {
                return false;
            }

            var segments = song.SegmentPositions
                .Select(sp => sp.Segment)
                .Distinct()
                .ToList();

            foreach (var segmentPosition in song.SegmentPositions.ToList())
            {
                _context.SongSegmentPositions.Remove(segmentPosition);
            }

            foreach (var segment in segments)
            {
                _context.SongSegments.Remove(segment);
            }

            foreach (var songChord in song.SongChords.ToList())
            {
                _context.SongChords.Remove(songChord);
            }

            foreach (var songPattern in song.SongPatterns.ToList())
            {
                _context.SongPatterns.Remove(songPattern);
            }

            foreach (var comment in song.Comments.ToList())
            {
                _context.SongComments.Remove(comment);
            }

            foreach (var review in song.Reviews.ToList())
            {
                _context.SongReviews.Remove(review);
            }

            _dbSet.Remove(song);

            var result = await _context.SaveChangesAsync(cancellationToken) > 0;

            if (result)
            {
                _logger.LogInformation("Song deleted from database: {SongId}", id);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting song from database: {SongId}", id);
            throw;
        }
    }
}
