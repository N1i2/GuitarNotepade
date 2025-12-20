using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Commands.Songs;

public record UpdateReviewLikeCommand(
    Guid UserId,
    Guid LikeId,
    bool IsLike) : IRequest<ReviewLikeDto>;