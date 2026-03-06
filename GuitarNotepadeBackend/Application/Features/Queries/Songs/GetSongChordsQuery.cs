using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Queries.Songs;

public class GetSongChordsQuery : IRequest<List<SongChordDto>>
{
    public Guid SongId { get; }
    public Guid? UserId { get; }

    public GetSongChordsQuery(Guid songId, Guid? userId = null)
    {
        SongId = songId;
        UserId = userId;
    }
}
