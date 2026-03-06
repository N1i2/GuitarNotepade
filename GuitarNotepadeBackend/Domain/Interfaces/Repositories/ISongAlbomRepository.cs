using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface ISongAlbomRepository : IBaseRepository<SongAlbum>
{
    Task<SongAlbum?> GetByAlbumAndSongAsync(Guid albumId, Guid songId, CancellationToken cancellationToken = default);
    Task<List<SongAlbum>> GetByAlbumIdAsync(Guid albumId, CancellationToken cancellationToken = default);
    Task<List<SongAlbum>> GetBySongIdAsync(Guid songId, CancellationToken cancellationToken = default);
    Task<int> CountByAlbumIdAsync(Guid albumId, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid albumId, Guid songId, CancellationToken cancellationToken = default);
    Task DeleteByAlbumAndSongAsync(Guid albumId, Guid songId, CancellationToken cancellationToken = default);
    Task<List<Song>> GetSongsByAlbumIdAsync(Guid albumId, CancellationToken cancellationToken = default);
    Task<List<Album>> GetAlbumsBySongIdAsync(Guid songId, CancellationToken cancellationToken = default);
}
