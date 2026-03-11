using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface ISubscriptionRepository : IBaseRepository<Subscription>
{
    Task<Subscription?> GetSubscriptionAsync(Guid userId, Guid subId, bool isUserSub, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid userId, Guid subId, bool isUserSub, CancellationToken cancellationToken = default);
    Task<List<Subscription>> GetUserSubscriptionsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<List<Subscription>> GetSubscribersAsync(Guid subId, bool isUserSub, CancellationToken cancellationToken = default);
    Task<int> CountUserSubscriptionsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<int> CountSubscribersAsync(Guid subId, bool isUserSub, CancellationToken cancellationToken = default);
}
