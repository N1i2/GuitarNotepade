using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class SongCommentService : ISongCommentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<SongCommentService> _logger;

    public SongCommentService(IUnitOfWork unitOfWork, ILogger<SongCommentService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<SongComment> CreateCommentAsync(
        Guid songId,
        string text,
        Guid? segmentId = null,
        CancellationToken cancellationToken = default)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);
        if (song == null)
            throw new ArgumentException("Song not found", nameof(songId));

        if (!song.CanAddComment())
            throw new InvalidOperationException("Maximum number of comments reached for this song");

        if (segmentId.HasValue)
        {
            var segment = await _unitOfWork.SongSegments.GetByIdAsync(segmentId.Value, cancellationToken);
            if (segment == null)
                throw new ArgumentException("Segment not found", nameof(segmentId));
        }

        var comment = SongComment.Create(songId, text, segmentId);
        comment = await _unitOfWork.SongComments.CreateAsync(comment, cancellationToken);

        _logger.LogInformation("Comment created: {CommentId} for song {SongId}", comment.Id, songId);
        return comment;
    }

    public async Task<SongComment> UpdateCommentAsync(
        Guid commentId,
        string newText,
        CancellationToken cancellationToken = default)
    {
        var comment = await _unitOfWork.SongComments.GetByIdAsync(commentId, cancellationToken);
        if (comment == null)
            throw new ArgumentException("Comment not found", nameof(commentId));

        comment.Update(newText);
        comment = await _unitOfWork.SongComments.UpdateAsync(comment, cancellationToken);

        _logger.LogInformation("Comment updated: {CommentId}", commentId);
        return comment!;
    }

    public async Task DeleteCommentAsync(
        Guid commentId,
        CancellationToken cancellationToken = default)
    {
        var comment = await _unitOfWork.SongComments.GetByIdAsync(commentId, cancellationToken);
        if (comment == null)
            throw new ArgumentException("Comment not found", nameof(commentId));

        await _unitOfWork.SongComments.DeleteAsync(commentId, cancellationToken);

        _logger.LogInformation("Comment deleted: {CommentId}", commentId);
    }

    public async Task<List<SongComment>> GetSongCommentsAsync(
        Guid songId,
        int page = 1,
        int pageSize = 50,
        Guid? segmentId = null,
        CancellationToken cancellationToken = default)
    {
        if (segmentId.HasValue)
        {
            return await _unitOfWork.SongComments.GetBySegmentIdAsync(segmentId.Value, cancellationToken);
        }
        else
        {
            return await _unitOfWork.SongComments.GetBySongIdAsync(songId, page, pageSize, cancellationToken);
        }
    }

    public async Task<List<SongComment>> GetSegmentCommentsAsync(
        Guid segmentId,
        CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.SongComments.GetBySegmentIdAsync(segmentId, cancellationToken);
    }

    public async Task<bool> CanAddCommentToSongAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.SongComments.CanAddCommentToSongAsync(songId, cancellationToken);
    }
}