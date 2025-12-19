using Domain.Common;
using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace Infrastructure.Repositories;

public class SongSegmentRepository : BaseRepository<SongSegment>, ISongSegmentRepository
{
    public SongSegmentRepository(AppDbContext context) : base(context) { }

    public async Task<List<SongSegment>> GetBySongIdAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.Positions.Any(p => p.SongId == songId))
            .Include(s => s.Chord)
            .Include(s => s.Pattern)
            .Include(s => s.Positions)
            .OrderBy(s => s.Positions.FirstOrDefault(p => p.SongId == songId)!.PositionIndex)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SongSegment>> GetSegmentsByChordIdAsync(
        Guid chordId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.ChordId == chordId)
            .Include(s => s.Positions)
            .ThenInclude(p => p.Song)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SongSegment>> GetSegmentsByPatternIdAsync(
        Guid patternId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.PatternId == patternId)
            .Include(s => s.Positions)
            .ThenInclude(p => p.Song)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SongSegment>> GetSegmentsByTypeAsync(
        SegmentType type,
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.Type == type && s.Positions.Any(p => p.SongId == songId))
            .Include(s => s.Chord)
            .Include(s => s.Pattern)
            .ToListAsync(cancellationToken);
    }

    public async Task<SongSegment?> FindDuplicateAsync(
        string? lyric,
        Guid? chordId,
        Guid? patternId,
        CancellationToken cancellationToken = default)
    {
        var hash = CalculateContentHash(lyric, chordId, patternId);
        return await _dbSet
            .FirstOrDefaultAsync(s => s.ContentHash == hash, cancellationToken);
    }

    public async Task<List<SongSegment>> GetSegmentsWithLabelsAsync(
        List<Guid> labelIds,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(s => s.SegmentLabels.Any(sl => labelIds.Contains(sl.LabelId)))
            .Include(s => s.Positions)
            .ThenInclude(p => p.Song)
            .ToListAsync(cancellationToken);
    }

    public async Task<Dictionary<Guid, List<SongSegment>>> GetSegmentsGroupedBySongAsync(
        List<Guid> songIds,
        CancellationToken cancellationToken = default)
    {
        var segments = await _dbSet
            .Where(s => s.Positions.Any(p => songIds.Contains(p.SongId)))
            .Include(s => s.Positions)
            .ToListAsync(cancellationToken);

        return segments
            .SelectMany(s => s.Positions.Select(p => new { p.SongId, Segment = s }))
            .Where(x => songIds.Contains(x.SongId))
            .GroupBy(x => x.SongId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Segment).Distinct().ToList());
    }

    private string CalculateContentHash(string? lyric, Guid? chordId, Guid? patternId)
    {
        return SongSegment.CalculateContentHash(lyric, chordId, patternId);
    }
}