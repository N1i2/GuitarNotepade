using MediatR;

namespace Application.Features.Commands.Alboms;

public class AddSongToFavoriteCommand : IRequest<bool>
{
    public Guid UserId { get; }
    public Guid SongId { get; }

    public AddSongToFavoriteCommand(Guid userId, Guid songId)
    {
        UserId = userId;
        SongId = songId;
    }
}
