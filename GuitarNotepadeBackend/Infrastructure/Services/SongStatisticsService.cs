using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class SongStatisticsService : ISongStatisticsService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<SongStatisticsService> _logger;

    public SongStatisticsService(IUnitOfWork unitOfWork, ILogger<SongStatisticsService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Dictionary<string, object>> GetSongStatsAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);
        if (song == null)
            throw new ArgumentException("Song not found", nameof(songId));

        var reviewsCount = await _unitOfWork.SongReviews.CountBySongIdAsync(songId, cancellationToken);
        var commentsCount = await _unitOfWork.SongComments.CountBySongIdAsync(songId, cancellationToken);

        var chordIds = await _unitOfWork.SongChords.GetChordIdsForSongAsync(songId, cancellationToken);
        var patternIds = await _unitOfWork.SongPatterns.GetPatternIdsForSongAsync(songId, cancellationToken);

        var segmentPositions = await _unitOfWork.SongSegmentPositions.GetBySongIdAsync(songId, cancellationToken);
        var segmentTypes = segmentPositions
            .Select(sp => sp.Segment.Type)
            .GroupBy(t => t)
            .ToDictionary(g => g.Key.ToString(), g => g.Count());

        return new Dictionary<string, object>
        {
            ["songId"] = songId,
            ["title"] = song.Title,
            ["reviewCount"] = reviewsCount,
            ["averageBeautifulRating"] = song.AverageBeautifulRating!,
            ["averageDifficultyRating"] = song.AverageDifficultyRating!,
            ["commentsCount"] = commentsCount,
            ["chordsCount"] = chordIds.Count,
            ["patternsCount"] = patternIds.Count,
            ["segmentsCount"] = segmentPositions.Count,
            ["segmentTypes"] = segmentTypes,
            ["createdAt"] = song.CreatedAt,
            ["updatedAt"] = song.UpdatedAt!
        };
    }

    public async Task<Dictionary<string, object>> GetUserSongStatsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var songs = await _unitOfWork.Songs.GetByUserIdAsync(userId, cancellationToken);
        var publicSongs = songs.Where(s => s.IsPublic).ToList();
        var privateSongs = songs.Where(s => !s.IsPublic).ToList();

        var reviews = await _unitOfWork.SongReviews.GetByUserIdAsync(userId, cancellationToken);
        var totalReviews = reviews.Count;
        var averageBeautifulRating = reviews.Where(r => r.BeautifulLevel.HasValue)
            .Average(r => r.BeautifulLevel);
        var averageDifficultyRating = reviews.Where(r => r.DifficultyLevel.HasValue)
            .Average(r => r.DifficultyLevel);

        var totalChords = songs.SelectMany(s => s.GetChordIds()).Distinct().Count();
        var totalPatterns = songs.SelectMany(s => s.GetPatternIds()).Distinct().Count();

        return new Dictionary<string, object>
        {
            ["userId"] = userId,
            ["totalSongs"] = songs.Count,
            ["publicSongs"] = publicSongs.Count,
            ["privateSongs"] = privateSongs.Count,
            ["totalReviewsWritten"] = totalReviews,
            ["averageBeautifulRatingGiven"] = averageBeautifulRating!,
            ["averageDifficultyRatingGiven"] = averageDifficultyRating!,
            ["totalChordsUsed"] = totalChords,
            ["totalPatternsUsed"] = totalPatterns,
            ["mostRecentSong"] = songs.OrderByDescending(s => s.CreatedAt).FirstOrDefault()?.Title!,
            ["mostReviewedSong"] = songs.OrderByDescending(s => s.ReviewCount).FirstOrDefault()?.Title!
        };
    }

    public async Task<List<(string period, int count)>> GetSongCreationTrendAsync(
        DateTime fromDate,
        DateTime toDate,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _unitOfWork.Songs.GetQueryable()
            .Where(s => s.CreatedAt >= fromDate && s.CreatedAt <= toDate);

        if (userId.HasValue)
        {
            query = query.Where(s => s.OwnerId == userId.Value);
        }

        var songs = await query.ToListAsync(cancellationToken);

        var dailyGroup = songs
            .GroupBy(s => s.CreatedAt.Date)
            .Select(g => ($"{g.Key:yyyy-MM-dd}", g.Count()))
            .OrderBy(x => x.Item1)
            .ToList();

        return dailyGroup;
    }

    public async Task<Dictionary<string, int>> GetPopularChordsStatsAsync(
        int topN = 10,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _unitOfWork.SongChords.GetQueryable()
            .Include(sc => sc.Song)
            .Include(sc => sc.Chord)
            .AsQueryable();

        if (userId.HasValue)
        {
            query = query.Where(sc => sc.Song.OwnerId == userId.Value);
        }
        else
        {
            query = query.Where(sc => sc.Song.IsPublic);
        }

        var chordStats = await query
            .GroupBy(sc => new { sc.ChordId, sc.Chord.Name })
            .Select(g => new
            {
                ChordName = g.Key.Name,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .Take(topN)
            .ToDictionaryAsync(x => x.ChordName, x => x.Count, cancellationToken);

        return chordStats;
    }

    public async Task<Dictionary<string, int>> GetPopularPatternsStatsAsync(
    int topN = 10,
    Guid? userId = null,
    CancellationToken cancellationToken = default)
    {
        var query = _unitOfWork.SongPatterns.GetQueryable()
            .Include(sp => sp.Song)
            .Include(sp => sp.StrummingPattern)
            .AsQueryable();

        if (userId.HasValue)
        {
            query = query.Where(sp => sp.Song.OwnerId == userId.Value);
        }
        else
        {
            query = query.Where(sp => sp.Song.IsPublic);
        }

        var patternStats = await query
            .GroupBy(sp => new { sp.StrummingPatternId, sp.StrummingPattern.Name })
            .Select(g => new
            {
                PatternName = g.Key.Name,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .Take(topN)
            .ToDictionaryAsync(x => x.PatternName, x => x.Count, cancellationToken);

        return patternStats;
    }

    public async Task<Dictionary<string, decimal>> GetAverageRatingsStatsAsync(
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _unitOfWork.SongReviews.GetQueryable()
            .Where(r => r.BeautifulLevel.HasValue || r.DifficultyLevel.HasValue);

        if (userId.HasValue)
        {
            query = query.Where(r => r.UserId == userId.Value);
        }

        var reviews = await query.ToListAsync(cancellationToken);

        var beautifulReviews = reviews.Where(r => r.BeautifulLevel.HasValue).ToList();
        var difficultyReviews = reviews.Where(r => r.DifficultyLevel.HasValue).ToList();

        return new Dictionary<string, decimal>
        {
            ["averageBeautifulRating"] = beautifulReviews.Any()
                ? Math.Round((decimal)beautifulReviews.Average(r => r.BeautifulLevel!.Value), 2)
                : 0,
            ["averageDifficultyRating"] = difficultyReviews.Any()
                ? Math.Round((decimal)difficultyReviews.Average(r => r.DifficultyLevel!.Value), 2)
                : 0,
            ["totalRatingsGiven"] = beautifulReviews.Count + difficultyReviews.Count,
            ["beautifulRatingsCount"] = beautifulReviews.Count,
            ["difficultyRatingsCount"] = difficultyReviews.Count
        };
    }
}
