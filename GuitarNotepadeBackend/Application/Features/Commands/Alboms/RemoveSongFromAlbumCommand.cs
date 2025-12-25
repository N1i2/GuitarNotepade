using MediatR;

namespace Application.Features.Commands.Albums;

public record RemoveSongFromAlbumCommand(Guid UserId, Guid AlbumId, Guid SongId) : IRequest<Unit>;