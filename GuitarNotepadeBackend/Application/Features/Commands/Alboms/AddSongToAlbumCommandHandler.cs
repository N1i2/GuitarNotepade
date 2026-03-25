using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Commands.Alboms;

public class AddSongToAlbumCommandHandler : IRequestHandler<AddSongToAlbumCommand, Unit>
{
    private readonly IAlbumService _albumService;
    private readonly ISongService _songService;

    public AddSongToAlbumCommandHandler(
        IAlbumService albumService,
        ISongService songService)
    {
        _albumService = albumService;
        _songService = songService;
    }

    public async Task<Unit> Handle(AddSongToAlbumCommand request, CancellationToken cancellationToken)
    {
        await _albumService.AddSongToAlbumAsync(
            request.AlbumId,
            request.SongId,
            request.UserId,
            cancellationToken);

        return Unit.Value;
    }
}
