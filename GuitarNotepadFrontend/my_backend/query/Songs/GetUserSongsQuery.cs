using Application.DTOs.Generic;
using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Queries.Songs;

public record GetUserSongsQuery(
    Guid UserId,
    bool IncludePrivate = false,
    int Page = 1,
    int PageSize = 20) : IRequest<PaginatedDto<SongDto>>;