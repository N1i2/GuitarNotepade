using Application.DTOs;
using Application.DTOs.Chords;
using MediatR;

namespace Application.Features.Queries.Chords;

public class GetAllChordsQuery : IRequest<PaginatedChordsDto>
{
    public ChordFiltersDto Filters { get; }

    public GetAllChordsQuery(ChordFiltersDto filters)
    {
        Filters = filters;
    }
}
