using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Commands.Songs;

public record ToggleReviewLikeCommand(
    Guid UserId,
    Guid ReviewId) : IRequest<ReviewLikeDto>;