using Domain.Entities;

namespace Domain.Interfaces.Services;

public interface ISongCommentService
{
    Task<SongComment> CreateCommentAsync(
        Guid userId,
        Guid songId,
        string text,
        Guid? segmentId = null,
        CancellationToken cancellationToken = default);

    Task<SongComment> UpdateCommentAsync(
        Guid commentId,
        string newText,
        CancellationToken cancellationToken = default);

    Task DeleteCommentAsync(
        Guid commentId,
        CancellationToken cancellationToken = default);

    Task<List<SongComment>> GetSongCommentsAsync(
        Guid songId,
        int page = 1,
        int pageSize = 50,
        Guid? segmentId = null,
        CancellationToken cancellationToken = default);

    Task<List<SongComment>> GetSegmentCommentsAsync(
        Guid segmentId,
        CancellationToken cancellationToken = default);

    Task<bool> CanAddCommentToSongAsync(
        Guid songId,
        CancellationToken cancellationToken = default);
}