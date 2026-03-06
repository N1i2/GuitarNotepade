using Application.DTOs.Generic;
using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Queries.Songs;

public class GetSongReviewsQuery : IRequest<PaginatedDto<SongReviewDto>>
{
    public Guid SongId { get; }
    public int Page { get; }
    public int PageSize { get; }
    public string SortBy { get; }
    public bool Descending { get; }

    public GetSongReviewsQuery(
        Guid songId,
        int page,
        int pageSize,
        string sortBy,
        bool descending)
    {
        SongId = songId;
        Page = page;
        PageSize = pageSize;
        SortBy = sortBy;
        Descending = descending;
    }
}

