using Application.Features.Commands.Songs;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Comments;

public class DeleteCommentCommandHandler : IRequestHandler<DeleteCommentCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<DeleteCommentCommandHandler> _logger;

    public DeleteCommentCommandHandler(
        IUnitOfWork unitOfWork,
        ILogger<DeleteCommentCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task Handle(DeleteCommentCommand request, CancellationToken cancellationToken)
    {
        var comments = await _unitOfWork.SongComments.GetBySegmentIdAsync(
            (request.SegmetId != null) ? 
            request.SegmetId.Value : 
            null,
            cancellationToken);

        var comment = comments.FirstOrDefault(c => c.UserId == request.UserId);

        if (comment == null)
        {
            throw new KeyNotFoundException("Comment not found");
        }

        if (comment.UserId != request.UserId)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);
            if (user?.Role != Domain.Common.Constants.Roles.Admin)
            {
                throw new UnauthorizedAccessException("You don't have permission to delete this comment");
            }
        }

        await _unitOfWork.SongComments.DeleteAsync(comment.Id, cancellationToken);

        _logger.LogInformation("Comment {CommentId} deleted by user {UserId}", comment.Id, request.UserId);
    }
}