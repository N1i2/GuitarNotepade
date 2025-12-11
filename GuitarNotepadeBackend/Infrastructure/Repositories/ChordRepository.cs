using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class ChordRepository : BaseRepository<Chord>, IChordRepository
{
    public ChordRepository(AppDbContext context) : base(context) { }

    public async Task<bool> ExistsWithSameFingeringAsync(string name, string fingering, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(c => c.Name == name && c.Fingering == fingering, cancellationToken);
    }

    public async Task<Chord?> GetByNameAndFingeringAsync(string name, string fingering, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(c => c.Name == name && c.Fingering == fingering, cancellationToken);
    }

    public async Task<List<Chord>> SearchByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.Name.Contains(name))
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Chord>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.CreatedByUserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<string>> GetDistinctChordNamesAsync(string? searchTerm = null, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.AsQueryable();

        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(c => c.Name.Contains(searchTerm));
        }

        return await query
            .Select(c => c.Name)
            .Distinct()
            .OrderBy(name => name)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Chord>> GetChordsByDistinctNamesAsync(string? searchTerm = null, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.AsQueryable();

        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(c => c.Name.Contains(searchTerm));
        }

        return await query
            .GroupBy(c => c.Name)
            .Select(g => g.First())
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }
}
