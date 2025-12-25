using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface IAlbomRepository : IBaseRepository<Album>
{
    public Task<Album?> GetByTitleAndOwnerAsync(string title, Guid ownerId, CancellationToken cancellationToken = default);
    public Task<Album?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);

}
