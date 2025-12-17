using MediatR;

namespace Application.Features.Commands.Reviews;

public class DeleteReviewCommand : IRequest<bool>
{
    public Guid ReviewId { get; }
    public Guid UserId { get; }
    public string UserRole { get; }

    public DeleteReviewCommand(Guid reviewId, Guid userId, string userRole)
    {
        ReviewId = reviewId;
        UserId = userId;
        UserRole = userRole;
    }
}