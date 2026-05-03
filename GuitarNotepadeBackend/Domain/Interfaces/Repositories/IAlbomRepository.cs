using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface IAlbomRepository : IBaseRepository<Album>
{
    Task<Album?> GetByTitleAndOwnerAsync(string title, Guid ownerId, CancellationToken cancellationToken = default);
    Task<Album?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Album?> GetFavoriteAlbumByOwnerAsync(Guid ownerId, CancellationToken cancellationToken = default);
    Task<bool> IsSongInAlbumAsync(Guid albumId, Guid songId, CancellationToken cancellationToken = default);
    Task<bool> ExistsByTitleAndOwnerAsync(string title, Guid ownerId, CancellationToken cancellationToken = default);
}
