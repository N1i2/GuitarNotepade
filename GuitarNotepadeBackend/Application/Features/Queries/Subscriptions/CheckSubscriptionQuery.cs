using MediatR;

namespace Application.Features.Queries.Subscriptions;

public record CheckSubscriptionQuery(
    Guid UserId,
    Guid SubId,
    bool IsUserSub
) : IRequest<bool>;