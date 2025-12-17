using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Reviews;

public class GetSongReviewStatsQueryHandler : IRequestHandler<GetSongReviewStatsQuery, object>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetSongReviewStatsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<object> Handle(
        GetSongReviewStatsQuery request,
        CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
        {
            throw new KeyNotFoundException($"Song with ID {request.SongId} not found");
        }

        var reviews = await _unitOfWork.SongReviews.GetBySongIdAsync(request.SongId, cancellationToken);

        var totalReviews = reviews.Count;
        var reviewsWithBeautifulLevel = reviews.Where(r => r.BeautifulLevel.HasValue).ToList();
        var reviewsWithDifficultyLevel = reviews.Where(r => r.DifficultyLevel.HasValue).ToList();

        var averageBeautifulLevel = reviewsWithBeautifulLevel.Any()
            ? reviewsWithBeautifulLevel.Average(r => r.BeautifulLevel!.Value)
            : (double?)null;

        var averageDifficultyLevel = reviewsWithDifficultyLevel.Any()
            ? reviewsWithDifficultyLevel.Average(r => r.DifficultyLevel!.Value)
            : (double?)null;

        var totalLikes = reviews.Sum(r => r.LikesCount);
        var totalDislikes = reviews.Sum(r => r.DislikesCount);

        var ratingDistribution = Enumerable.Range(1, 5)
            .Select(rating => new
            {
                Rating = rating,
                Count = reviewsWithBeautifulLevel.Count(r => r.BeautifulLevel == rating)
            })
            .ToList();

        return new
        {
            SongId = request.SongId,
            SongTitle = song.Title,
            TotalReviews = totalReviews,
            AverageBeautifulLevel = averageBeautifulLevel,
            AverageDifficultyLevel = averageDifficultyLevel,
            TotalLikes = totalLikes,
            TotalDislikes = totalDislikes,
            RatingDistribution = ratingDistribution,
            HasReviews = totalReviews > 0,
            LastReviewDate = reviews.Any() ? reviews.Max(r => r.CreatedAt) : (DateTime?)null
        };
    }
}