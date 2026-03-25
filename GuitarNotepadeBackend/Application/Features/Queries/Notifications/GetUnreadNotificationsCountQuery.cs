using MediatR;

namespace Application.Features.Queries.Notifications;

public class GetUnreadNotificationsCountQuery : IRequest<int>
{
    public Guid UserId { get; set; }

    public GetUnreadNotificationsCountQuery(Guid userId)
    {
        UserId = userId;
    }
}