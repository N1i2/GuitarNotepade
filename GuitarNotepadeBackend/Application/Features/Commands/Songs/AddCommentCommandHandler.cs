using Application.DTOs.Song;
using AutoMapper;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Comments;

public class AddCommentCommandHandler : IRequestHandler<AddCommentCommand, SongCommentDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISongCommentService _commentService;
    private readonly IMapper _mapper;
    private readonly ILogger<AddCommentCommandHandler> _logger;

    public AddCommentCommandHandler(
        IUnitOfWork unitOfWork,
        ISongCommentService commentService,
        IMapper mapper,
        ILogger<AddCommentCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _commentService = commentService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<SongCommentDto> Handle(AddCommentCommand request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
        {
            throw new KeyNotFoundException($"Song with id {request.SongId} not found");
        }

        if (!await _commentService.CanAddCommentToSongAsync(request.SongId, cancellationToken))
        {
            throw new InvalidOperationException("Maximum number of comments reached for this song");
        }

        SongComment? existingComment = null;

        if (request.SegmentId.HasValue)
        {
            var segmentComments = await _unitOfWork.SongComments.GetBySegmentIdAsync(request.SegmentId.Value, cancellationToken);
            existingComment = segmentComments.FirstOrDefault(c => c.UserId == request.UserId);
        }
        else
        {
            var songComments = await _unitOfWork.SongComments.GetBySongIdAsync(request.SongId, 1, int.MaxValue, cancellationToken);
            existingComment = songComments.FirstOrDefault(c => c.UserId == request.UserId && c.SegmentId == null);
        }

        SongComment resultComment;

        if (existingComment != null)
        {
            _logger.LogInformation("Updating existing comment {CommentId} for user {UserId}",
                existingComment.Id, request.UserId);

            existingComment.Update(request.Text);
            await _unitOfWork.SongComments.UpdateAsync(existingComment, cancellationToken);
            resultComment = existingComment;
        }
        else
        {
            _logger.LogInformation("Creating new comment for user {UserId} on song {SongId}",
                request.UserId, request.SongId);

            var newComment = SongComment.Create(
                userId: request.UserId,
                songId: request.SongId,
                text: request.Text,
                segmentId: request.SegmentId);

            resultComment = await _unitOfWork.SongComments.CreateAsync(newComment, cancellationToken);
        }

        return _mapper.Map<SongCommentDto>(resultComment);
    }
}