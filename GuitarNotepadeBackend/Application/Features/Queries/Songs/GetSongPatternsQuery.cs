using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Queries.Songs;

public class GetSongPatternsQuery : IRequest<List<SongPatternDto>>
{
    public Guid SongId { get; }
    public Guid? UserId { get; }

    public GetSongPatternsQuery(Guid songId, Guid? userId = null)
    {
        SongId = songId;
        UserId = userId;
    }
}
