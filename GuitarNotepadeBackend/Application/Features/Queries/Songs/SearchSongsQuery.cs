using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Queries.Songs;

public class SearchSongsQuery : IRequest<SongSearchResultDto>
{
    public SongSearchFilters Filters { get; }

    public SearchSongsQuery(SongSearchFilters filters)
    {
        Filters = filters;
    }
}

