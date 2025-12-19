using MediatR;

namespace Application.Features.Commands.Songs;

public record DeleteReviewLikeCommand(
    Guid UserId,
    Guid LikeId) : IRequest<bool>;