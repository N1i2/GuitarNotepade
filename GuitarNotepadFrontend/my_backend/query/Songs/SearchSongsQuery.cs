using MediatR;

namespace Application.Features.Queries.Songs;

public record SearchSongsQuery(
    SongSearchFilters Filters) : IRequest<SongSearchResultDto>;