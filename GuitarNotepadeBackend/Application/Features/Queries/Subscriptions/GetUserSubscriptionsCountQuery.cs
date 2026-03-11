using MediatR;

namespace Application.Features.Queries.Subscriptions;

public record GetUserSubscriptionsCountQuery(Guid UserId) : IRequest<int>;