using Application.DTOs.Alboms;
using MediatR;

namespace Application.Features.Queries.Albums;

public record SearchAlbumsQuery(
    AlbumSearchFilters Filters) : IRequest<AlbumSearchResultDto>;