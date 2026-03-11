using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Commands.Songs;

public class UpdateSongCommand : IRequest<SongDto>
{
    public Guid SongId { get; }
    public Guid UserId { get; }
    public string UserRole { get; }
    public UpdateSongDto Dto { get; }

    public UpdateSongCommand(Guid songId, Guid userId, string userRole, UpdateSongDto dto)
    {
        SongId = songId;
        UserId = userId;
        UserRole = userRole;
        Dto = dto;
    }
}
