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
}
