using Application.DTOs.Subscriptions;
using MediatR;

namespace Application.Features.Queries.Subscriptions;

public record GetUserSubscriptionsQuery(Guid UserId) : IRequest<List<SubscriptionDto>>;