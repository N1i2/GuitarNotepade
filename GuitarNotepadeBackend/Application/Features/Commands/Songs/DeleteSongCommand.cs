using MediatR;

namespace Application.Features.Commands.Songs;

public class DeleteSongCommand : IRequest<bool>
{
    public Guid SongId { get; }
    public Guid UserId { get; }
    public string UserRole { get; }

    public DeleteSongCommand(Guid songId, Guid userId, string userRole)
    {
        SongId = songId;
        UserId = userId;
        UserRole = userRole;
    }
}
