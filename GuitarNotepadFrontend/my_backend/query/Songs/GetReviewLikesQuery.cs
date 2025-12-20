using Application.DTOs.Generic;
using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Queries.Songs;

public record GetReviewLikesQuery(
    Guid ReviewId,
    int Page = 1,
    int PageSize = 50) : IRequest<PaginatedDto<ReviewLikeDto>>;