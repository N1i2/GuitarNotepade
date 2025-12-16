using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface IStrummingPatternRepository:IBaseRepository<StrummingPattern>
{
    Task<List<StrummingPattern>> SearchByNameAsync(string name, CancellationToken cancellationToken = default);
    Task<List<StrummingPattern>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<List<string>> GetAllNamesAsync(string? searchTerm = null, CancellationToken cancellationToken = default);
    Task<bool> ExistsWithSameNameAsync(string name, CancellationToken cancellationToken = default);
}
