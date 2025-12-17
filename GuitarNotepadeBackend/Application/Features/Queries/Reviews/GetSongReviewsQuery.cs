using Application.DTOs.Generic;
using Application.DTOs.Reviews;
using MediatR;

namespace Application.Features.Queries.Reviews;

public class GetSongReviewsQuery : IRequest<PaginatedDto<SongReviewDto>>
{
    public Guid SongId { get; }
    public int Page { get; }
    public int PageSize { get; }
    public string SortBy { get; }
    public string SortOrder { get; }

    public GetSongReviewsQuery(
        Guid songId,
        int page = 1,
        int pageSize = 20,
        string sortBy = "createdAt",
        string sortOrder = "desc")
    {
        SongId = songId;
        Page = page;
        PageSize = pageSize;
        SortBy = sortBy;
        SortOrder = sortOrder;
    }
}
