using Application.DTOs;
using Application.DTOs.Chords;
using Application.DTOs.Generic;
using MediatR;

namespace Application.Features.Queries.Chords;

public class GetAllChordsQuery : IRequest<PaginatedDto<ChordDto>>
{
    public ChordFiltersDto Filters { get; }

    public GetAllChordsQuery(ChordFiltersDto filters)
    {
        Filters = filters;
    }
}
