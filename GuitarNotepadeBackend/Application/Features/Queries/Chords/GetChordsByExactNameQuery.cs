using Application.DTOs.Chords;
using Application.DTOs.Generic;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Queries.Chords;

public class GetChordsByExactNameQuery : IRequest<PaginatedDto<ChordDto>>
{
    public string Name { get; }
    public int Page { get; }
    public int PageSize { get; }

    public GetChordsByExactNameQuery(string name, int page = 1, int pageSize = 20)
    {
        Name = name;
        Page = page;
        PageSize = pageSize;
    }
}
