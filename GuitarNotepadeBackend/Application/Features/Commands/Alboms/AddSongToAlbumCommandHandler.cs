using Application.Features.Queries.Songs;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Commands.Alboms;

public class AddSongToAlbumCommandHandler : IRequestHandler<AddSongToAlbumCommand, Unit>
{
    private readonly IUnitOfWork _unitOfWork;

    public AddSongToAlbumCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Unit> Handle(AddSongToAlbumCommand request, CancellationToken cancellationToken)
    {
        var album = await _unitOfWork.Alboms.GetByIdAsync(request.AlbumId, cancellationToken);
        if (album == null)
        {
            throw new KeyNotFoundException($"Album with id {request.AlbumId} not found");
        }

        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
        {
            throw new KeyNotFoundException($"Song with id {request.SongId} not found");
        }

        if (album.OwnerId != request.UserId)
        {
            throw new UnauthorizedAccessException("You don't have permission to modify this album");
        }

        var existing = await _unitOfWork.SongAlboms.GetByAlbumAndSongAsync(
            request.AlbumId, request.SongId, cancellationToken);

        if (existing != null)
        {
            throw new InvalidOperationException("Song is already in this album");
        }

        var songAlbum = SongAlbum.Create(
            album.Id,
            request.SongId
            );

        await _unitOfWork.SongAlboms.AddAsync(songAlbum, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
