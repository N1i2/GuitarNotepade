using MediatR;

namespace Application.Features.Queries.Subscriptions;

public record CheckSubscriptionQuery(
    Guid UserId,
    Guid SubId
) : IRequest<bool>;