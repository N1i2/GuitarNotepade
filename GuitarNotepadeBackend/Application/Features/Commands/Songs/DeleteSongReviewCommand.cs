using MediatR;

namespace Application.Features.Commands.Songs;

public record DeleteSongReviewCommand(
    Guid UserId,
    Guid ReviewId) : IRequest<bool>;