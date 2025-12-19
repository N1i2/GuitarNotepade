using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface ISongLabelRepository : IBaseRepository<SongLabel>
{
    Task<SongLabel?> GetByNameAsync(
        string name,
        CancellationToken cancellationToken = default);

    Task<List<SongLabel>> SearchByNameAsync(
        string searchTerm,
        CancellationToken cancellationToken = default);

    Task<List<SongLabel>> GetLabelsForSegmentAsync(
        Guid segmentId,
        CancellationToken cancellationToken = default);

    Task<List<SongLabel>> GetLabelsForSongAsync(
        Guid songId,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsByNameAsync(
        string name,
        CancellationToken cancellationToken = default);

    Task<Dictionary<Guid, List<SongLabel>>> GetLabelsForSegmentsAsync(
        List<Guid> segmentIds,
        CancellationToken cancellationToken = default);
}