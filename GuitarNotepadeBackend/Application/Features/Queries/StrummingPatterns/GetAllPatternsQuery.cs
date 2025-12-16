using Application.DTOs.Generic;
using Application.DTOs.StrummingPatterns;
using MediatR;

namespace Application.Features.Queries.StrummingPatterns;

public class GetAllPatternsQuery: IRequest<PaginatedDto<StrummingPatternsDto>>
{
    public StrummingPatternsFiltersDto Filters { get; }

    public GetAllPatternsQuery(StrummingPatternsFiltersDto filters)
    {
        Filters = filters;
    }
}
