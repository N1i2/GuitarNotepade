using Domain.Entities.Base;
using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface IBaseRepository<T> where T : BaseEntityWithId
{
    IQueryable<T> GetQueryable();
    Task<List<T>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<T?> CreateNewAsync(T newObj, CancellationToken cancellationToken = default);
    Task<T?> UpdateByIdAsync(Guid id, T newObj, CancellationToken cancellationToken = default);
    Task<T?> DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<T?> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
}