using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface ISongPatternRepository : IBaseRepository<SongPattern>
{
    Task<List<SongPattern>> GetBySongIdAsync(
        Guid songId,
        CancellationToken cancellationToken = default);

    Task<List<SongPattern>> GetByPatternIdAsync(
        Guid patternId,
        CancellationToken cancellationToken = default);

    Task<SongPattern?> GetBySongAndPatternAsync(
        Guid songId,
        Guid patternId,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(
        Guid songId,
        Guid patternId,
        CancellationToken cancellationToken = default);

    Task<int> CountByPatternIdAsync(
        Guid patternId,
        CancellationToken cancellationToken = default);

    Task<List<Guid>> GetPatternIdsForSongAsync(
        Guid songId,
        CancellationToken cancellationToken = default);

    Task<List<Guid>> GetSongIdsForPatternAsync(
        Guid patternId,
        CancellationToken cancellationToken = default);
}
