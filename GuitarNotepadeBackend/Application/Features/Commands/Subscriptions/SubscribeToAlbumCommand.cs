using Application.DTOs.Subscriptions;
using MediatR;

namespace Application.Features.Commands.Subscriptions;

public record SubscribeToAlbumCommand(
    Guid UserId,
    Guid AlbumId
) : IRequest<SubscriptionResponseDto>;