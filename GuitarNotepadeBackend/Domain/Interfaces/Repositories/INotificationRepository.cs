using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface INotificationRepository : IBaseRepository<Notification>
{
    Task<List<Notification>> GetUserNotificationsAsync(
        Guid userId,
        int take,
        int skip = 0,
        CancellationToken cancellationToken = default);

    Task<int> DeleteReadNotificationsOlderThanAsync(DateTime cutoffUtc, CancellationToken cancellationToken = default);
}