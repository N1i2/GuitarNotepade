using Domain.Interfaces;
using MediatR;

namespace Application.Features.Commands.Alboms;

public class RemoveSongFromAlbumCommandHandler : IRequestHandler<RemoveSongFromAlbumCommand, Unit>
{
    private readonly IUnitOfWork _unitOfWork;

    public RemoveSongFromAlbumCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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

        var songAlbum = await _unitOfWork.SongAlboms.GetByAlbumAndSongAsync(
            request.AlbumId, request.SongId, cancellationToken);

        if (songAlbum == null)
        {
            throw new KeyNotFoundException($"Song is not in this album");
        }

        await _unitOfWork.SongAlboms.DeleteAsync(songAlbum.Id, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
