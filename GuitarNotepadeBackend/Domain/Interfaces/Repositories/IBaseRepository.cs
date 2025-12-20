using Domain.Entities.Base;
using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface IBaseRepository<T> where T : BaseEntityWithId
{
    IQueryable<T> GetQueryable();
    Task<List<T>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<T> CreateAsync(T newObj, CancellationToken cancellationToken = default);   
    Task<T?> UpdateAsync(T entity, CancellationToken cancellationToken = default);  
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default); 
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
    void Add(T entity);
    Task AddAsync(T entity, CancellationToken cancellationToken = default);
}