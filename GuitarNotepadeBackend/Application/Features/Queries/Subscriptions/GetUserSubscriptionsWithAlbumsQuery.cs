using Application.DTOs.Subscriptions;
using MediatR;

namespace Application.Features.Queries.Subscriptions;

public record GetUserSubscriptionsWithAlbumsQuery(Guid UserId) : IRequest<List<SubscriptionWithAlbumDto>>;