// Domain/Interfaces/Services/IAlbumService.cs
using Domain.Entities;

namespace Domain.Interfaces.Services;

public interface IAlbumService
{
    Task<Album> CreateAlbumAsync(Guid userId, string title, bool isPublic, string? genre = null, string? theme = null, string? coverUrl = null, string? description = null, CancellationToken cancellationToken = default);
    Task<Album> UpdateAlbumAsync(Guid albumId, Guid userId, string? title = null, bool? isPublic = null, string? genre = null, string? theme = null, string? coverUrl = null, string? description = null, CancellationToken cancellationToken = default);
    Task DeleteAlbumAsync(Guid albumId, Guid userId, CancellationToken cancellationToken = default);
    Task<Album> GetAlbumByIdAsync(Guid albumId, CancellationToken cancellationToken = default);
    Task<Album> GetFavoriteAlbumAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<List<Album>> GetUserAlbumsAsync(Guid userId, bool includePrivate = false, CancellationToken cancellationToken = default);
    Task AddSongToAlbumAsync(Guid albumId, Guid songId, Guid userId, CancellationToken cancellationToken = default);
    Task RemoveSongFromAlbumAsync(Guid albumId, Guid songId, Guid userId, CancellationToken cancellationToken = default);
    Task AddSongToFavoriteAsync(Guid userId, Guid songId, CancellationToken cancellationToken = default);
    Task RemoveSongFromFavoriteAsync(Guid userId, Guid songId, CancellationToken cancellationToken = default);
    Task<bool> IsAlbumOwnerAsync(Guid albumId, Guid userId, CancellationToken cancellationToken = default);
}
