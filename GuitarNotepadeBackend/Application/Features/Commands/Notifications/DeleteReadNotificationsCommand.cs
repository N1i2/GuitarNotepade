using MediatR;

namespace Application.Features.Commands.Notifications;

public class DeleteReadNotificationsCommand : IRequest<int>
{
    public Guid UserId { get; set; }

    public DeleteReadNotificationsCommand(Guid userId)
    {
        UserId = userId;
    }
}