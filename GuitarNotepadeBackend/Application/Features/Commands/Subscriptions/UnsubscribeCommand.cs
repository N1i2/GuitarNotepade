using MediatR;

namespace Application.Features.Commands.Subscriptions;

public record UnsubscribeCommand(
    Guid UserId,
    Guid SubId,
    bool IsUserSub
) : IRequest<Unit>;