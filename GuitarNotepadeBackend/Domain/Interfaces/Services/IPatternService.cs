// Domain/Interfaces/Services/IPatternService.cs
using Domain.Entities;

namespace Domain.Interfaces.Services;

public interface IPatternService
{
    Task<StrummingPattern> CreatePatternAsync(string name, string pattern, bool isFingerStyle, Guid userId, string? description = null, CancellationToken cancellationToken = default);
    Task<StrummingPattern> UpdatePatternAsync(Guid patternId, Guid userId, string? name = null, string? pattern = null, bool? isFingerStyle = null, string? description = null, CancellationToken cancellationToken = default);
    Task DeletePatternAsync(Guid patternId, Guid userId, string userRole, CancellationToken cancellationToken = default);
    Task<StrummingPattern> GetPatternByIdAsync(Guid patternId, CancellationToken cancellationToken = default);
    Task<List<StrummingPattern>> GetUserPatternsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> ExistsWithSameNameAsync(string name, CancellationToken cancellationToken = default);
}
