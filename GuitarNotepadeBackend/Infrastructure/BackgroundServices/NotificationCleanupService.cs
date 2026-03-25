using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.BackgroundServices;

public class NotificationCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<NotificationCleanupService> _logger;
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromDays(1);
    private readonly TimeSpan _readNotificationsRetention = TimeSpan.FromDays(30);

    public NotificationCleanupService(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<NotificationCleanupService> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Notification Cleanup Service started");

        await Task.Delay(TimeSpan.FromHours(1), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupOldNotifications(stoppingToken);
                await Task.Delay(_cleanupInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during notification cleanup");
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }

        _logger.LogInformation("Notification Cleanup Service stopped");
    }

    private async Task CleanupOldNotifications(CancellationToken cancellationToken)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        var cutoffDate = DateTime.UtcNow - _readNotificationsRetention;

        _logger.LogInformation("Cleaning up read notifications older than {CutoffDate}", cutoffDate);

        var oldNotifications = await unitOfWork.Notifications
            .GetQueryable()
            .Where(n => n.IsRead && n.CreatedAt < cutoffDate)
            .ToListAsync(cancellationToken);

        if (!oldNotifications.Any())
        {
            _logger.LogInformation("No old notifications to clean up");
            return;
        }

        _logger.LogInformation("Found {Count} old notifications to delete", oldNotifications.Count);

        foreach (var notification in oldNotifications)
        {
            await unitOfWork.Notifications.DeleteAsync(notification.Id, cancellationToken);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Successfully deleted {Count} old read notifications",
            oldNotifications.Count);
    }
}