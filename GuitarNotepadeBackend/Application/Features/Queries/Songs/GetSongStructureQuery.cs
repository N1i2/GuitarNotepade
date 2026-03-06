using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Queries.Songs;

public class GetSongStructureQuery : IRequest<SongStructureDto>
{
    public Guid SongId { get; }
    public Guid? UserId { get; }

    public GetSongStructureQuery(Guid songId, Guid? userId = null)
    {
        SongId = songId;
        UserId = userId;
    }
}
