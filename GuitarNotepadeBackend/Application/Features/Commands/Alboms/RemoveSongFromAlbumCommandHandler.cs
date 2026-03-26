using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Commands.Alboms;

public class RemoveSongFromAlbumCommandHandler : IRequestHandler<RemoveSongFromAlbumCommand, Unit>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService _notificationService;

    public RemoveSongFromAlbumCommandHandler(
        IUnitOfWork unitOfWork,
        INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }

    public async Task<Unit> Handle(RemoveSongFromAlbumCommand request, CancellationToken cancellationToken)
    {
        var album = await _unitOfWork.Alboms.GetByIdAsync(request.AlbumId, cancellationToken);

        if (album == null)
        {
            throw new KeyNotFoundException($"Album with id {request.AlbumId} not found");
        }

        if (album.OwnerId != request.UserId)
        {
            throw new UnauthorizedAccessException("You don't have permission to modify this album");
        }

        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
        {
            throw new KeyNotFoundException($"Song with id {request.SongId} not found");
        }

        var songAlbum = await _unitOfWork.SongAlboms.GetByAlbumAndSongAsync(
            request.AlbumId, request.SongId, cancellationToken);

        if (songAlbum == null)
        {
            throw new KeyNotFoundException($"Song is not in this album");
        }

        await _unitOfWork.SongAlboms.DeleteAsync(songAlbum.Id, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _notificationService.NotifyAlbumChangedAsync(
            albumId: album.Id,
            type: NotificationType.SongRemoved,
            songId: song.Id,
            cancellationToken: cancellationToken);

        return Unit.Value;
    }
}
