using Application.DTOs.Chords;
using Application.DTOs.StrummingPatterns;
using MediatR;

namespace Application.Features.Queries.StrummingPatterns;

public class GetPatternByIdQuery : IRequest<StrummingPatternsDto>
{
    public Guid PatternId { get; }

    public GetPatternByIdQuery(Guid patternId)
    {
        PatternId = patternId;
    }
}