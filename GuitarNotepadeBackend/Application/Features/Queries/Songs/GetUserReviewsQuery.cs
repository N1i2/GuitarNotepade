using Application.DTOs.Generic;
using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Queries.Songs;

public class GetUserReviewsQuery : IRequest<PaginatedDto<SongReviewDto>>
{
    public Guid UserId { get; }
    public int Page { get; }
    public int PageSize { get; }

    public GetUserReviewsQuery(Guid userId, int page, int pageSize)
    {
        UserId = userId;
        Page = page;
        PageSize = pageSize;
    }
}

