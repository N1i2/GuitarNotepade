// Domain/Interfaces/Services/IChordService.cs
using Domain.Entities;

namespace Domain.Interfaces.Services;

public interface IChordService
{
    Task<Chord> CreateChordAsync(string name, string fingering, Guid userId, string? description = null, CancellationToken cancellationToken = default);
    Task<Chord> UpdateChordAsync(Guid chordId, Guid userId, string? name = null, string? fingering = null, string? description = null, CancellationToken cancellationToken = default);
    Task DeleteChordAsync(Guid chordId, Guid userId, string userRole, CancellationToken cancellationToken = default);
    Task<Chord> GetChordByIdAsync(Guid chordId, CancellationToken cancellationToken = default);
    Task<List<Chord>> GetUserChordsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> ExistsWithSameFingeringAsync(string name, string fingering, CancellationToken cancellationToken = default);
}
