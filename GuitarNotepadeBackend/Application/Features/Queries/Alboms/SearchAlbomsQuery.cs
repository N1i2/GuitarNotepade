using Application.DTOs.Alboms;
using MediatR;

namespace Application.Features.Queries.Alboms;

public record SearchAlbumsQuery(
    AlbumSearchFilters Filters) : IRequest<AlbumSearchResultDto>;
