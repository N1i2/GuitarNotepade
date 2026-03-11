using Domain.Entities;
using Domain.Common;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class UserService : IUserService
{
    private readonly IUnitOfWork _unitOfWork;

    public UserService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<User> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.Users.GetByIdAsync(id, cancellationToken);
    }

    public async Task<User> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.Users.GetByEmailAsync(email, cancellationToken);
    }

    public async Task<bool> CanCreateMoreSongsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await GetByIdAsync(userId, cancellationToken);
        if (user == null) return false;

        if (user.IsPremium || user.IsAdmin) return true;

        var songsCount = await GetUserSongsCountAsync(userId, cancellationToken);
        return songsCount < Constants.Limits.FreeUserMaxSongs;
    }

    public async Task<bool> CanCreateMoreChordsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await GetByIdAsync(userId, cancellationToken);
        if (user == null) return false;

        if (user.IsPremium || user.IsAdmin) return true;

        var chordsCount = await GetUserChordsCountAsync(userId, cancellationToken);
        return chordsCount < Constants.Limits.FreeUserMaxChords;
    }

    public async Task<bool> CanCreateMorePatternsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await GetByIdAsync(userId, cancellationToken);
        if (user == null) return false;

        if (user.IsPremium || user.IsAdmin) return true;

        var patternsCount = await GetUserPatternsCountAsync(userId, cancellationToken);
        return patternsCount < Constants.Limits.FreeUserMaxPatterns;
    }

    public async Task<bool> CanCreateAlbumAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            return false;
        }

        return user.IsPremium || user.IsAdmin;
    }

    public async Task<int> GetUserSongsCountAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.Songs.GetQueryable()
            .Where(s => s.OwnerId == userId)
            .CountAsync(cancellationToken);
    }

    public async Task<int> GetUserChordsCountAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.Chords.GetQueryable()
            .Where(c => c.CreatedByUserId == userId)
            .CountAsync(cancellationToken);
    }

    public async Task<int> GetUserPatternsCountAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.StrummingPatterns.GetQueryable()
            .Where(p => p.CreatedByUserId == userId)
            .CountAsync(cancellationToken);
    }

    public async Task<int> GetUserAlbumsCountAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.Alboms.GetQueryable()
            .Where(a => a.OwnerId == userId && a.Title != "Favorite")
            .CountAsync(cancellationToken);
    }

    public async Task UpgradeToPremiumAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await GetByIdAsync(userId, cancellationToken);
        if (user == null)
            throw new KeyNotFoundException($"User with ID {userId} not found");

        user.MakePremium();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
