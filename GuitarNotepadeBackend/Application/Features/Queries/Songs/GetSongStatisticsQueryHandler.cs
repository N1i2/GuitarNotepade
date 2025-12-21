using Application.DTOs.Song;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Songs;

public class GetSongStatisticsQueryHandler : IRequestHandler<GetSongStatisticsQuery, SongStatisticsDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISongStatisticsService _songStatisticsService;

    public GetSongStatisticsQueryHandler(
        IUnitOfWork unitOfWork,
        ISongStatisticsService songStatisticsService)
    {
        _unitOfWork = unitOfWork;
        _songStatisticsService = songStatisticsService;
    }

    public async Task<SongStatisticsDto> Handle(GetSongStatisticsQuery request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetQueryable()
            .Include(s => s.Structure)
                .ThenInclude(st => st.SegmentPositions)
                    .ThenInclude(sp => sp.Segment)
            .Include(s => s.SongChords)
            .Include(s => s.SongPatterns)
            .Include(s => s.Reviews)
            .FirstOrDefaultAsync(s => s.Id == request.SongId, cancellationToken);

        if (song == null)
            throw new ArgumentException("Song not found", nameof(request.SongId));

        song.UpdateStatistics();

        var segmentsCount = song.Structure?.SegmentPositions?.Count ?? 0;
        var segmentTypes = song.Structure?.SegmentPositions?
            .GroupBy(sp => sp.Segment.Type)
            .ToDictionary(g => g.Key.ToString(), g => g.Count()) ?? new Dictionary<string, int>();

        var commentsCount = await _unitOfWork.SongComments.CountBySongIdAsync(request.SongId, cancellationToken);

        return new SongStatisticsDto
        {
            SongId = song.Id,
            Title = song.Title,
            ReviewCount = song.ReviewCount,
            AverageBeautifulRating = song.AverageBeautifulRating,
            AverageDifficultyRating = song.AverageDifficultyRating,
            CommentsCount = commentsCount,
            ChordsCount = song.SongChords.Count,
            PatternsCount = song.SongPatterns.Count,
            SegmentsCount = segmentsCount,
            SegmentTypes = segmentTypes,
            CreatedAt = song.CreatedAt,
            UpdatedAt = song.UpdatedAt
        };
    }
}

