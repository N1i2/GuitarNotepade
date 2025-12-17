using Application.DTOs.Generic;
using Application.DTOs.Songs;
using MediatR;

namespace Application.Features.Queries.Songs;

public class SearchSongsQuery : IRequest<PaginatedDto<SongDto>>
{
    public SongFiltersDto Filters { get; }

    public SearchSongsQuery(SongFiltersDto filters)
    {
        Filters = filters;
    }
}
