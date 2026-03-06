using Application.DTOs.Generic;
using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Queries.Songs;

public class GetUserSongsQuery : IRequest<PaginatedDto<SongDto>>
{
    public Guid UserId { get; }
    public bool IncludePrivate { get; }
    public int Page { get; }
    public int PageSize { get; }

    public GetUserSongsQuery(Guid userId, bool includePrivate, int page, int pageSize)
    {
        UserId = userId;
        IncludePrivate = includePrivate;
        Page = page;
        PageSize = pageSize;
    }
}

