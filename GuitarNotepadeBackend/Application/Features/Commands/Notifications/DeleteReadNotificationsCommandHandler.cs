using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Notifications;

public class DeleteReadNotificationsCommandHandler : IRequestHandler<DeleteReadNotificationsCommand, int>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<DeleteReadNotificationsCommandHandler> _logger;

    public DeleteReadNotificationsCommandHandler(
        IUnitOfWork unitOfWork,
        ILogger<DeleteReadNotificationsCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<int> Handle(DeleteReadNotificationsCommand request, CancellationToken cancellationToken)
    {
        var readNotifications = await _unitOfWork.Notifications
            .GetQueryable()
            .Where(n => n.UserId == request.UserId && n.IsRead)
            .ToListAsync(cancellationToken);

        if (!readNotifications.Any())
        {
            return 0;
        }

        foreach (var notification in readNotifications)
        {
            await _unitOfWork.Notifications.DeleteAsync(notification.Id, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Deleted {Count} read notifications for user {UserId}",
            readNotifications.Count,
            request.UserId);

        return readNotifications.Count;
    }
}