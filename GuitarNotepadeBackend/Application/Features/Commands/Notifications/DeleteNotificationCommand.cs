using MediatR;

namespace Application.Features.Commands.Notifications;

public class DeleteNotificationCommand : IRequest<Unit>
{
    public Guid UserId { get; set; }
    public Guid NotificationId { get; set; }

    public DeleteNotificationCommand(Guid userId, Guid notificationId)
    {
        UserId = userId;
        NotificationId = notificationId;
    }
}
