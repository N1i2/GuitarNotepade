using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Alboms;

public class AddSongToFavoriteCommandHandler : IRequestHandler<AddSongToFavoriteCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AddSongToFavoriteCommandHandler> _logger;

    public AddSongToFavoriteCommandHandler(IUnitOfWork unitOfWork, ILogger<AddSongToFavoriteCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<bool> Handle(AddSongToFavoriteCommand request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
            throw new KeyNotFoundException($"Song with id {request.SongId} not found");

        var favoriteAlbum = await _unitOfWork.Alboms.GetFavoriteAlbumByOwnerAsync(request.UserId, cancellationToken);

        if (favoriteAlbum == null)
        {
            favoriteAlbum = Album.Create(
                ownerId: request.UserId,
                title: Constants.Albums.FavoriteTitle,
                isPublic: false,
                description: "My favorite songs");

            favoriteAlbum = await _unitOfWork.Alboms.CreateAsync(favoriteAlbum, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var existing = await _unitOfWork.SongAlboms.GetByAlbumAndSongAsync(
            favoriteAlbum.Id, request.SongId, cancellationToken);

        if (existing != null)
            throw new InvalidOperationException("Song is already in favorites");

        var songAlbum = SongAlbum.Create(favoriteAlbum.Id, request.SongId);
        await _unitOfWork.SongAlboms.AddAsync(songAlbum, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Song {SongId} added to favorites by user {UserId}",
            request.SongId, request.UserId);

        return true;
    }
}
