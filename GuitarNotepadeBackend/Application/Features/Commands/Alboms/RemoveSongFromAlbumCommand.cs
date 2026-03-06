using MediatR;

namespace Application.Features.Commands.Alboms;

public record RemoveSongFromAlbumCommand(Guid UserId, Guid AlbumId, Guid SongId) : IRequest<Unit>;
