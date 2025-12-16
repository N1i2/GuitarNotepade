using Application.DTOs.StrummingPatterns;
using MediatR;

namespace Application.Features.Queries.StrummingPatterns;

public class GetPatternByNameQuery : IRequest<StrummingPatternsDto>
{
    public string PatternName { get; }

    public GetPatternByNameQuery(string patternName)
    {
        PatternName = patternName;
    }
}
