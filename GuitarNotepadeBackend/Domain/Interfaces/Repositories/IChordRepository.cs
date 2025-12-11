using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface IChordRepository : IBaseRepository<Chord>
{
    Task<bool> ExistsWithSameFingeringAsync(string name, string fingering, CancellationToken cancellationToken = default);
    Task<Chord?> GetByNameAndFingeringAsync(string name, string fingering, CancellationToken cancellationToken = default);
    Task<List<Chord>> SearchByNameAsync(string name, CancellationToken cancellationToken = default);
    Task<List<Chord>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<List<string>> GetDistinctChordNamesAsync(string? searchTerm = null, CancellationToken cancellationToken = default);
    Task<List<Chord>> GetChordsByDistinctNamesAsync(string? searchTerm = null, CancellationToken cancellationToken = default);
}