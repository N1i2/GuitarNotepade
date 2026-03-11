using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class StrummingPatternRepository : BaseRepository<StrummingPattern>, IStrummingPatternRepository
{
    public StrummingPatternRepository(AppDbContext context) : base(context) { }

    public async Task<List<StrummingPattern>> SearchByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(sp => sp.Name.Contains(name))
            .OrderBy(sp => sp.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<StrummingPattern>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(sp => sp.CreatedByUserId == userId)
            .OrderByDescending(sp => sp.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<string>> GetAllNamesAsync(string? searchTerm = null, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.AsQueryable();

        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(sp => sp.Name.Contains(searchTerm));
        }

        return await query
            .Select(sp=>sp.Name)
            .Distinct()
            .OrderBy(name => name)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExistsWithSameNameAsync(string name, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(sp => sp.Name == name, cancellationToken);
    }
}
