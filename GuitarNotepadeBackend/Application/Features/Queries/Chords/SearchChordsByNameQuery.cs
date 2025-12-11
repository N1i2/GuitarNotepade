using Application.DTOs;
using Application.DTOs.Chords;
using MediatR;

namespace Application.Features.Queries.Chords;

public class SearchChordsByNameQuery : IRequest<PaginatedChordsDto>
{
    public string Name { get; }
    public int Page { get; }
    public int PageSize { get; }

    public SearchChordsByNameQuery(string name, int page = 1, int pageSize = 10)
    {
        Name = name;
        Page = page;
        PageSize = pageSize;
    }
}