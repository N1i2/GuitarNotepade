using MediatR;

namespace Application.Features.Commands.Albums;

public record AddSongToAlbumCommand(Guid UserId, Guid AlbumId, Guid SongId) : IRequest<Unit>;