using MediatR;

namespace Application.Features.Commands.Alboms;

public class DeleteAlbumCommand : IRequest
{
    public Guid UserId { get; }
    public Guid AlbumId { get; }

    public DeleteAlbumCommand(Guid userId, Guid albumId)
    {
        UserId = userId;
        AlbumId = albumId;
    }
}
