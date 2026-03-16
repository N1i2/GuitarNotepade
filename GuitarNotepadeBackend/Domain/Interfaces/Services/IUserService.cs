using Domain.Entities;

namespace Domain.Interfaces.Services;

public interface IUserService
{
    Task<User> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<User> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> CanCreateMoreSongsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> CanCreateMoreChordsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> CanCreateMorePatternsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> CanCreateAlbumAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<int> GetUserSongsCountAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<int> GetUserChordsCountAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<int> GetUserPatternsCountAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<int> GetUserAlbumsCountAsync(Guid userId, CancellationToken cancellationToken = default);
    Task UpgradeToPremiumAsync(Guid userId, CancellationToken cancellationToken = default);
}
