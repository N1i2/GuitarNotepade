using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Commands.Songs;

public record CreateReviewLikeCommand(
    Guid UserId,
    Guid ReviewId,
    bool IsLike) : IRequest<ReviewLikeDto>;