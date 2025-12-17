using MediatR;

namespace Application.Features.Commands.Reviews;

public class ToggleReviewLikeCommand : IRequest<bool>
{
    public Guid ReviewId { get; }
    public Guid UserId { get; }
    public bool IsLike { get; } 

    public ToggleReviewLikeCommand(Guid reviewId, Guid userId, bool isLike)
    {
        ReviewId = reviewId;
        UserId = userId;
        IsLike = isLike;
    }
}
