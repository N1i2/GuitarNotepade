using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class DeleteSongCommentCommandHandler : IRequestHandler<DeleteSongCommentCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteSongCommentCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(DeleteSongCommentCommand request, CancellationToken cancellationToken)
    {
        var comment = await _unitOfWork.SongComments.GetQueryable()
            .Include(c => c.Song)
            .FirstOrDefaultAsync(c => c.Id == request.CommentId, cancellationToken);

        if (comment == null)
            throw new ArgumentException("Comment not found", nameof(request.CommentId));

        if (comment.Song.OwnerId != request.UserId)
        {
            throw new UnauthorizedAccessException("You don't have permission to delete this comment");
        }

        await _unitOfWork.SongComments.DeleteAsync(comment.Id, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}

