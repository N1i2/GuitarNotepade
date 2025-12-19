using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface ISongStructureRepository : IBaseRepository<SongStructure>
{
    Task<SongStructure?> GetBySongIdAsync(
        Guid songId,
        CancellationToken cancellationToken = default);

    Task<SongStructure?> GetWithSegmentsAsync(
        Guid songId,
        CancellationToken cancellationToken = default);

    Task<List<SongStructure>> GetStructuresWithSegmentsAsync(
        List<Guid> songIds,
        CancellationToken cancellationToken = default);
}