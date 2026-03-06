using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface ISongRepository : IBaseRepository<Song>
{
    Task<List<Song>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<List<Song>> GetPublicSongsAsync(int page, int pageSize, string? searchTerm = null,
        string? sortBy = null, bool descending = false, CancellationToken cancellationToken = default);
    Task<Song?> GetByTitleAndOwnerAsync(string title, Guid ownerId,
        CancellationToken cancellationToken = default);

    Task<List<Song>> SearchAsync(string searchTerm, int page, int pageSize,
        CancellationToken cancellationToken = default);
    Task<List<Song>> SearchByChordAsync(Guid chordId, CancellationToken cancellationToken = default);
    Task<List<Song>> SearchByPatternAsync(Guid patternId, CancellationToken cancellationToken = default);

    Task<List<Song>> GetByParentIdAsync(Guid parentSongId, CancellationToken cancellationToken = default);

    Task<int> CountPublicSongsAsync(string? searchTerm = null,
        CancellationToken cancellationToken = default);
    Task<int> CountByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
}
