using Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Notifications;

public class MarkNotificationAsReadCommandHandler : IRequestHandler<MarkNotificationAsReadCommand, Unit>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<MarkNotificationAsReadCommandHandler> _logger;

    public MarkNotificationAsReadCommandHandler(
        IUnitOfWork unitOfWork,
        ILogger<MarkNotificationAsReadCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Unit> Handle(MarkNotificationAsReadCommand request, CancellationToken cancellationToken)
    {
        var notification = await _unitOfWork.Notifications.GetByIdAsync(request.NotificationId, cancellationToken);

        if (notification == null)
        {
            throw new KeyNotFoundException($"Notification with ID {request.NotificationId} not found");
        }

        if (notification.UserId != request.UserId)
        {
            throw new UnauthorizedAccessException("You don't have permission to modify this notification");
        }

        if (!notification.IsRead)
        {
            notification.MarkAsRead();
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Notification {NotificationId} marked as read for user {UserId}",
                request.NotificationId,
                request.UserId);
        }

        return Unit.Value;
    }
}
