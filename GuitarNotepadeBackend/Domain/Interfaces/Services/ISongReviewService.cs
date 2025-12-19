using Domain.Entities;

namespace Domain.Interfaces.Services;

public interface ISongReviewService
{
    Task<SongReview> CreateReviewAsync(
        Guid songId,
        Guid userId,
        string reviewText,
        int? beautifulLevel = null,
        int? difficultyLevel = null,
        CancellationToken cancellationToken = default);

    Task<SongReview> UpdateReviewAsync(
        Guid reviewId,
        string? reviewText = null,
        int? beautifulLevel = null,
        int? difficultyLevel = null,
        CancellationToken cancellationToken = default);

    Task DeleteReviewAsync(
        Guid reviewId,
        CancellationToken cancellationToken = default);

    Task<ReviewLike> ToggleReviewLikeAsync(
        Guid reviewId,
        Guid userId,
        bool isLike,
        CancellationToken cancellationToken = default);

    Task<ReviewLike> UpdateReviewLikeAsync(
        Guid reviewId,
        Guid userId,
        bool isLike,
        CancellationToken cancellationToken = default);

    Task RemoveReviewLikeAsync(
        Guid reviewId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<List<SongReview>> GetSongReviewsAsync(
        Guid songId,
        int page = 1,
        int pageSize = 20,
        string? sortBy = null,
        bool descending = false,
        CancellationToken cancellationToken = default);

    Task<List<SongReview>> GetUserReviewsAsync(
        Guid userId,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);

    Task<SongReview?> GetUserReviewForSongAsync(
        Guid userId,
        Guid songId,
        CancellationToken cancellationToken = default);

    Task<bool> CanUserReviewSongAsync(
        User user,
        Song song,
        CancellationToken cancellationToken = default);

    Task<(int total, int likes, int dislikes)> GetReviewStatsAsync(
        Guid reviewId,
        CancellationToken cancellationToken = default);

    Task<Dictionary<Guid, (int likes, int dislikes)>> GetReviewsStatsBatchAsync(
        List<Guid> reviewIds,
        CancellationToken cancellationToken = default);
}
