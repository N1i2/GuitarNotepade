using Application.DTOs;
using Application.DTOs.Chords;
using MediatR;

namespace Application.Features.Queries.Chords;

public class GetMyChordsQuery : IRequest<PaginatedChordsDto>
{
    public Guid UserId { get; }
    public int Page { get; }
    public int PageSize { get; }

    public GetMyChordsQuery(Guid userId, int page = 1, int pageSize = 20)
    {
        UserId = userId;
        Page = page;
        PageSize = pageSize;
    }
}