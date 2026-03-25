using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Notifications;

public class MarkAllNotificationsAsReadCommandHandler : IRequestHandler<MarkAllNotificationsAsReadCommand, int>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<MarkAllNotificationsAsReadCommandHandler> _logger;

    public MarkAllNotificationsAsReadCommandHandler(
        IUnitOfWork unitOfWork,
        ILogger<MarkAllNotificationsAsReadCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<int> Handle(MarkAllNotificationsAsReadCommand request, CancellationToken cancellationToken)
    {
        var unreadNotifications = await _unitOfWork.Notifications
            .GetQueryable()
            .Where(n => n.UserId == request.UserId && !n.IsRead)
            .ToListAsync(cancellationToken);

        if (!unreadNotifications.Any())
        {
            return 0;
        }

        foreach (var notification in unreadNotifications)
        {
            notification.MarkAsRead();
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Marked {Count} notifications as read for user {UserId}",
            unreadNotifications.Count,
            request.UserId);

        return unreadNotifications.Count;
    }
}
