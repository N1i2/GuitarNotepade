using MediatR;

namespace Application.Features.Commands.Alboms;

public class RemoveSongFromFavoriteCommand : IRequest<bool>
{
    public Guid UserId { get; }
    public Guid SongId { get; }

    public RemoveSongFromFavoriteCommand(Guid userId, Guid songId)
    {
        UserId = userId;
        SongId = songId;
    }
}
