using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Commands.Reviews;

public class ToggleReviewLikeCommandHandler : IRequestHandler<ToggleReviewLikeCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public ToggleReviewLikeCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(ToggleReviewLikeCommand request, CancellationToken cancellationToken)
    {
        var review = await _unitOfWork.SongReviews.GetByIdAsync(request.ReviewId, cancellationToken);
        if (review == null)
        {
            throw new KeyNotFoundException($"Review with ID {request.ReviewId} not found");
        }

        var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);
        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID {request.UserId} not found");
        }

        if (review.UserId == request.UserId)
        {
            throw new InvalidOperationException("You cannot like/dislike your own review");
        }

        var existingLike = await _unitOfWork.ReviewLikes.GetByReviewAndUserAsync(
            request.ReviewId, request.UserId, cancellationToken);

        if (existingLike != null)
        {
            if (existingLike.IsLike == request.IsLike)
            {
                review.RemoveLike(existingLike); 
                await _unitOfWork.ReviewLikes.DeleteAsync(existingLike.Id, cancellationToken);
            }
            else
            {
                existingLike.Toggle();

                if (request.IsLike)
                {
                    review.RemoveDislike();
                    review.AddLike(existingLike);
                }
                else
                {
                    review.RemoveLike();
                    var dislike = ReviewLike.Create(request.ReviewId, request.UserId, false);
                    review.AddLike(dislike);
                    existingLike = dislike; 
                }
            }
        }
        else
        {
            var newLike = ReviewLike.Create(request.ReviewId, request.UserId, request.IsLike);
            await _unitOfWork.ReviewLikes.CreateAsync(newLike, cancellationToken);
            review.AddLike(newLike);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}