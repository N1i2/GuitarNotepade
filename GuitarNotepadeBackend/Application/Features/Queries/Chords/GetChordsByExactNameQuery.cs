using Application.DTOs.Chords;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Chords.Queries;

public class GetChordsByExactNameQuery : IRequest<PaginatedChordsDto>
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
