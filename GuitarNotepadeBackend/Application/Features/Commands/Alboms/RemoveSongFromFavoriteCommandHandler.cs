using Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Alboms;

public class RemoveSongFromFavoriteCommandHandler : IRequestHandler<RemoveSongFromFavoriteCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<RemoveSongFromFavoriteCommandHandler> _logger;

    public RemoveSongFromFavoriteCommandHandler(IUnitOfWork unitOfWork, ILogger<RemoveSongFromFavoriteCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<bool> Handle(RemoveSongFromFavoriteCommand request, CancellationToken cancellationToken)
    {
        var favoriteAlbum = await _unitOfWork.Alboms.FindAsync(
            a => a.OwnerId == request.UserId && a.Title.ToLower() == "favorite",
            cancellationToken);

        if (favoriteAlbum == null)
            throw new KeyNotFoundException("Favorite album not found");

        var songAlbum = await _unitOfWork.SongAlboms.GetByAlbumAndSongAsync(
            favoriteAlbum.Id, request.SongId, cancellationToken);

        if (songAlbum == null)
            throw new KeyNotFoundException("Song not found in favorites");

        await _unitOfWork.SongAlboms.DeleteAsync(songAlbum.Id, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Song {SongId} removed from favorites by user {UserId}",
            request.SongId, request.UserId);

        return true;
    }
}
