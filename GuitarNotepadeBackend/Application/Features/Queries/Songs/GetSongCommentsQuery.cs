using Application.DTOs.Generic;
using MediatR;

namespace Application.Features.Queries.Songs;

public record GetSongCommentsQuery(
    Guid SongId,
    Guid? SegmentId = null,
    int Page = 1,
    int PageSize = 50) : IRequest<PaginatedDto<SongCommentDto>>;