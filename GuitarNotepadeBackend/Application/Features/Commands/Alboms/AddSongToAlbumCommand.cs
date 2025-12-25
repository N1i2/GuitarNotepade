using MediatR;

namespace Application.Features.Commands.Alboms;

public record AddSongToAlbumCommand(Guid UserId, Guid AlbumId, Guid SongId) : IRequest<Unit>;