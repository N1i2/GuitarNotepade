using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class SongReviewService : ISongReviewService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<SongReviewService> _logger;

    public SongReviewService(IUnitOfWork unitOfWork, ILogger<SongReviewService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<SongReview> CreateReviewAsync(
        Guid songId,
        Guid userId,
        string reviewText,
        int? beautifulLevel = null,
        int? difficultyLevel = null,
        CancellationToken cancellationToken = default)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);
        if (song == null)
            throw new ArgumentException("Song not found", nameof(songId));

        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user == null)
            throw new ArgumentException("User not found", nameof(userId));

        if (!SongReview.CanUserReviewSong(user, song))
            throw new InvalidOperationException("User cannot review this song");

        var existingReview = await _unitOfWork.SongReviews.GetBySongAndUserAsync(songId, userId, cancellationToken);
        if (existingReview != null)
            throw new InvalidOperationException("User has already reviewed this song");

        var review = SongReview.Create(songId, userId, reviewText, beautifulLevel, difficultyLevel);
        review = await _unitOfWork.SongReviews.CreateAsync(review, cancellationToken);

        await UpdateSongStatisticsAsync(songId, cancellationToken);

        _logger.LogInformation("Review created: {ReviewId} for song {SongId} by user {UserId}",
            review.Id, songId, userId);
        return review;
    }

    public async Task<SongReview> UpdateReviewAsync(
        Guid reviewId,
        string? reviewText = null,
        int? beautifulLevel = null,
        int? difficultyLevel = null,
        CancellationToken cancellationToken = default)
    {
        var review = await _unitOfWork.SongReviews.GetByIdAsync(reviewId, cancellationToken);
        if (review == null)
            throw new ArgumentException("Review not found", nameof(reviewId));

        review.Update(reviewText, beautifulLevel, difficultyLevel);
        review = await _unitOfWork.SongReviews.UpdateAsync(review, cancellationToken);

        await UpdateSongStatisticsAsync(review!.SongId, cancellationToken);

        _logger.LogInformation("Review updated: {ReviewId}", reviewId);
        return review;
    }

    public async Task DeleteReviewAsync(
        Guid reviewId,
        CancellationToken cancellationToken = default)
    {
        var review = await _unitOfWork.SongReviews.GetByIdAsync(reviewId, cancellationToken);
        if (review == null)
            throw new ArgumentException("Review not found", nameof(reviewId));

        await _unitOfWork.SongReviews.DeleteAsync(reviewId, cancellationToken);
        await UpdateSongStatisticsAsync(review.SongId, cancellationToken);

        _logger.LogInformation("Review deleted: {ReviewId}", reviewId);
    }

    public async Task<ReviewLike> ToggleReviewLikeAsync(
        Guid reviewId,
        Guid userId,
        bool isLike,
        CancellationToken cancellationToken = default)
    {
        var review = await _unitOfWork.SongReviews.GetByIdAsync(reviewId, cancellationToken);
        if (review == null)
            throw new ArgumentException("Review not found", nameof(reviewId));

        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user == null)
            throw new ArgumentException("User not found", nameof(userId));

        var existingLike = await _unitOfWork.ReviewLikes.GetByReviewAndUserAsync(reviewId, userId, cancellationToken);

        if (existingLike != null)
        {
            if (existingLike.IsLike == isLike)
            {
                await _unitOfWork.ReviewLikes.DeleteAsync(existingLike.Id, cancellationToken);
                review.RemoveLike(existingLike);
                await _unitOfWork.SongReviews.UpdateAsync(review, cancellationToken);

                _logger.LogInformation("Review like removed: {ReviewId} by user {UserId}", reviewId, userId);
                return existingLike;
            }
            else
            {
                existingLike.Toggle();
                review.RemoveLike(existingLike);
                review.AddLike(existingLike);
                await _unitOfWork.ReviewLikes.UpdateAsync(existingLike, cancellationToken);
                await _unitOfWork.SongReviews.UpdateAsync(review, cancellationToken);

                _logger.LogInformation("Review like toggled: {ReviewId} by user {UserId} to {IsLike}",
                    reviewId, userId, isLike);
                return existingLike;
            }
        }
        else
        {
            var like = ReviewLike.Create(reviewId, userId, isLike);
            like = await _unitOfWork.ReviewLikes.CreateAsync(like, cancellationToken);

            review.AddLike(like);
            await _unitOfWork.SongReviews.UpdateAsync(review, cancellationToken);

            _logger.LogInformation("Review like added: {ReviewId} by user {UserId} as {IsLike}",
                reviewId, userId, isLike);
            return like;
        }
    }

    public async Task<ReviewLike> UpdateReviewLikeAsync(
        Guid reviewId,
        Guid userId,
        bool isLike,
        CancellationToken cancellationToken = default)
    {
        var existingLike = await _unitOfWork.ReviewLikes.GetByReviewAndUserAsync(reviewId, userId, cancellationToken);
        if (existingLike == null)
            throw new ArgumentException("Like not found");

        var review = await _unitOfWork.SongReviews.GetByIdAsync(reviewId, cancellationToken);
        if (review == null)
            throw new ArgumentException("Review not found");

        review.RemoveLike(existingLike);
        existingLike = ReviewLike.Create(reviewId, userId, isLike);
        review.AddLike(existingLike);

        await _unitOfWork.ReviewLikes.UpdateAsync(existingLike, cancellationToken);
        await _unitOfWork.SongReviews.UpdateAsync(review, cancellationToken);

        _logger.LogInformation("Review like updated: {ReviewId} by user {UserId} to {IsLike}",
            reviewId, userId, isLike);
        return existingLike;
    }

    public async Task RemoveReviewLikeAsync(
        Guid reviewId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var like = await _unitOfWork.ReviewLikes.GetByReviewAndUserAsync(reviewId, userId, cancellationToken);
        if (like == null)
            throw new ArgumentException("Like not found");

        var review = await _unitOfWork.SongReviews.GetByIdAsync(reviewId, cancellationToken);
        if (review == null)
            throw new ArgumentException("Review not found");

        review.RemoveLike(like);
        await _unitOfWork.ReviewLikes.DeleteAsync(like.Id, cancellationToken);
        await _unitOfWork.SongReviews.UpdateAsync(review, cancellationToken);

        _logger.LogInformation("Review like removed: {ReviewId} by user {UserId}", reviewId, userId);
    }

    public async Task<List<SongReview>> GetSongReviewsAsync(
        Guid songId,
        int page = 1,
        int pageSize = 20,
        string? sortBy = null,
        bool descending = false,
        CancellationToken cancellationToken = default)
    {
        var reviews = await _unitOfWork.SongReviews.GetBySongIdAsync(songId, cancellationToken);

        reviews = (sortBy?.ToLower(), descending) switch
        {
            ("createdat", false) => reviews.OrderBy(r => r.CreatedAt).ToList(),
            ("createdat", true) => reviews.OrderByDescending(r => r.CreatedAt).ToList(),
            ("beautiful", false) => reviews.OrderBy(r => r.BeautifulLevel ?? 0).ToList(),
            ("beautiful", true) => reviews.OrderByDescending(r => r.BeautifulLevel ?? 0).ToList(),
            ("difficulty", false) => reviews.OrderBy(r => r.DifficultyLevel ?? 0).ToList(),
            ("difficulty", true) => reviews.OrderByDescending(r => r.DifficultyLevel ?? 0).ToList(),
            ("likes", false) => reviews.OrderBy(r => r.LikesCount).ToList(),
            ("likes", true) => reviews.OrderByDescending(r => r.LikesCount).ToList(),
            _ => reviews.OrderByDescending(r => r.CreatedAt).ToList()
        };

        return reviews
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();
    }

    public async Task<List<SongReview>> GetUserReviewsAsync(
        Guid userId,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var reviews = await _unitOfWork.SongReviews.GetByUserIdAsync(userId, cancellationToken);
        return reviews
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();
    }

    public async Task<SongReview?> GetUserReviewForSongAsync(
        Guid userId,
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.SongReviews.GetBySongAndUserAsync(songId, userId, cancellationToken);
    }

    public async Task<bool> CanUserReviewSongAsync(
        User user,
        Song song,
        CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask;
        return SongReview.CanUserReviewSong(user, song);
    }

    public async Task<(int total, int likes, int dislikes)> GetReviewStatsAsync(
        Guid reviewId,
        CancellationToken cancellationToken = default)
    {
        var likes = await _unitOfWork.ReviewLikes.CountLikesByReviewIdAsync(reviewId, cancellationToken);
        var dislikes = await _unitOfWork.ReviewLikes.CountDislikesByReviewIdAsync(reviewId, cancellationToken);

        return (likes + dislikes, likes, dislikes);
    }

    public async Task<Dictionary<Guid, (int likes, int dislikes)>> GetReviewsStatsBatchAsync(
        List<Guid> reviewIds,
        CancellationToken cancellationToken = default)
    {
        var result = new Dictionary<Guid, (int likes, int dislikes)>();

        foreach (var reviewId in reviewIds)
        {
            var stats = await GetReviewStatsAsync(reviewId, cancellationToken);
            result[reviewId] = (stats.likes, stats.dislikes);
        }

        return result;
    }

    private async Task UpdateSongStatisticsAsync(Guid songId, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);
        if (song != null)
        {
            song.UpdateStatistics();
            await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
        }
    }
}