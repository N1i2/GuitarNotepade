using MediatR;

namespace Application.Features.Commands.Notifications;

public class MarkNotificationAsReadCommand : IRequest<Unit>
{
    public Guid UserId { get; set; }
    public Guid NotificationId { get; set; }

    public MarkNotificationAsReadCommand(Guid userId, Guid notificationId)
    {
        UserId = userId;
        NotificationId = notificationId;
    }
}
