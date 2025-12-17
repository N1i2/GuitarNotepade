using Application.DTOs.Generic;
using Application.DTOs.Reviews;
using MediatR;

namespace Application.Features.Queries.Reviews;

public class GetUserReviewsQuery : IRequest<PaginatedDto<SongReviewDto>>
{
    public Guid UserId { get; }
    public int Page { get; }
    public int PageSize { get; }

    public GetUserReviewsQuery(Guid userId, int page = 1, int pageSize = 20)
    {
        UserId = userId;
        Page = page;
        PageSize = pageSize;
    }
}