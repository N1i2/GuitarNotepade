using Application.DTOs.Chords;
using Application.DTOs.StrummingPatterns;
using MediatR;

namespace Application.Features.Commands.StrummingPatterns;

public class UpdatePatternCommand : IRequest<StrummingPatternsDto>
{
    public Guid PatternId { get; }
    public Guid UserId { get; }
    public string? Name { get; }
    public string? Pattern { get; }
    public bool? IsFingerStyle { get; }
    public string? Description { get; }

    public UpdatePatternCommand(Guid patternId, Guid userId, string? name = null, string? pattern = null, bool? isFingerStyle = null, string? description = null)
    {
        PatternId = patternId;
        UserId = userId;
        Name = name;
        Pattern = pattern;
        IsFingerStyle = isFingerStyle;
        Description = description;
    }
}