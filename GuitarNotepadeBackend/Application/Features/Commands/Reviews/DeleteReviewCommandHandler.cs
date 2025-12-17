using Domain.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Commands.Reviews;

public class DeleteReviewCommandHandler : IRequestHandler<DeleteReviewCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteReviewCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(DeleteReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await _unitOfWork.SongReviews.GetByIdAsync(request.ReviewId, cancellationToken);
        if (review == null)
        {
            throw new KeyNotFoundException($"Review with ID {request.ReviewId} not found");
        }

        bool isOwner = review.UserId == request.UserId;
        bool isAdmin = request.UserRole == Constants.Roles.Admin;

        if (!isOwner && !isAdmin)
        {
            throw new UnauthorizedAccessException("You can only delete your own reviews or you must be an admin");
        }

        var reviewLikes = await _unitOfWork.ReviewLikes.GetByReviewIdAsync(request.ReviewId, cancellationToken);
        foreach (var like in reviewLikes)
        {
            await _unitOfWork.ReviewLikes.DeleteAsync(like.Id, cancellationToken);
        }

        await _unitOfWork.SongReviews.DeleteAsync(request.ReviewId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}