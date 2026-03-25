using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Notifications;

public class GetUnreadNotificationsCountQueryHandler : IRequestHandler<GetUnreadNotificationsCountQuery, int>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetUnreadNotificationsCountQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<int> Handle(GetUnreadNotificationsCountQuery request, CancellationToken cancellationToken)
    {
        return await _unitOfWork.Notifications
            .GetQueryable()
            .CountAsync(n => n.UserId == request.UserId && !n.IsRead, cancellationToken);
    }
}