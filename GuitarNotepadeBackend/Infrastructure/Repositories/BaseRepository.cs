using Domain.Entities.Base;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class BaseRepository<T> : IBaseRepository<T> where T : BaseEntityWithId
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;


    public BaseRepository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<List<T>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet.ToListAsync(cancellationToken);
    }

    public virtual async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FindAsync(new object[] { id }, cancellationToken);
    }

    public virtual async Task<T?> CreateNewAsync(T newObj, CancellationToken cancellationToken = default)
    {
        await _dbSet.AddAsync(newObj, cancellationToken);
        return newObj;
    }

    public virtual async Task<T?> UpdateByIdAsync(Guid id, T newObj, CancellationToken cancellationToken = default)
    {
        var existing = await GetByIdAsync(id, cancellationToken);
        if (existing == null)
        {
            return null;
        }

        _context.Entry(existing).CurrentValues.SetValues(newObj);
        return existing;
    }

    public virtual async Task<T?> DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity == null)
        {
            return null;
        }

        _dbSet.Remove(entity);
        return entity;
    }

    public async Task<T?> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity == null)
        {
            return null;
        }

        return entity;
    }

    public IQueryable<T> GetQueryable()
    {
        return _dbSet.AsQueryable();
    }
}
