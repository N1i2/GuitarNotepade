using Application.DTOs.Generic;
using MediatR;

namespace Application.Features.Queries.Songs;

public record GetSongReviewsQuery(
    Guid SongId,
    int Page = 1,
    int PageSize = 20,
    string SortBy = "createdAt",
    bool Descending = false) : IRequest<PaginatedDto<SongReviewDto>>;