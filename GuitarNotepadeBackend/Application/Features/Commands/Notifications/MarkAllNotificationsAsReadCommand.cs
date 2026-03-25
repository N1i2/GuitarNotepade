using MediatR;

namespace Application.Features.Commands.Notifications;

public class MarkAllNotificationsAsReadCommand : IRequest<int>
{
    public Guid UserId { get; set; }

    public MarkAllNotificationsAsReadCommand(Guid userId)
    {
        UserId = userId;
    }
}
