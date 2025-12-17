using Application.DTOs.Songs;
using MediatR;

namespace Application.Features.Queries.Songs;

public class GetSongByIdQuery : IRequest<SongDto>
{
    public Guid SongId { get; }
    public Guid? UserId { get; } 

    public GetSongByIdQuery(Guid songId, Guid? userId = null)
    {
        SongId = songId;
        UserId = userId;
    }
}
