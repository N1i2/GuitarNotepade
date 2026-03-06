using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Queries.Songs;

public class GetSongCommentsQuery : IRequest<List<SongCommentDto>>
{
    public Guid SongId { get; }
    public Guid? UserId { get; }
    public int Page { get; }
    public int PageSize { get; }

    public GetSongCommentsQuery(Guid songId, Guid? userId = null, int page = 1, int pageSize = 50)
    {
        SongId = songId;
        UserId = userId;
        Page = page;
        PageSize = pageSize;
    }
}
