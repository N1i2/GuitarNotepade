using Application.DTOs.Notifications;
using MediatR;

namespace Application.Features.Queries.Notifications;

public record GetUserNotificationsQuery(Guid UserId, int Take = 50, int Skip = 0)
    : IRequest<List<NotificationDto>>;

