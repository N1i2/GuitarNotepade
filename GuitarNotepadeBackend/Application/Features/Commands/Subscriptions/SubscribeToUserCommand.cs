using Application.DTOs.Subscriptions;
using MediatR;

namespace Application.Features.Commands.Subscriptions;

public record SubscribeToUserCommand(
    Guid UserId,
    Guid TargetUserId
) : IRequest<SubscriptionResponseDto>;