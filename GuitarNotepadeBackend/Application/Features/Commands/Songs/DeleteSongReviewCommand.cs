using MediatR;

namespace Application.Features.Commands.Songs;

public class DeleteSongReviewCommand : IRequest
{
    public Guid UserId { get; }
    public Guid ReviewId { get; }

    public DeleteSongReviewCommand(Guid userId, Guid reviewId)
    {
        UserId = userId;
        ReviewId = reviewId;
    }
}

