using Application.DTOs.Chords;
using Application.DTOs.StrummingPatterns;
using MediatR;

namespace Application.Features.Commands.StrummingPatterns;

public class CreatePatternCommand : IRequest<StrummingPatternsDto>
{
    public string Name { get; }
    public string Pattern { get; }
    public string? Description { get; }
    public bool IsFingerStyle { get; }
    public Guid UserId { get; }

    public CreatePatternCommand(string name, string pattern, bool isFingerStyle, Guid userId, string? description = null)
    {
        Name = name;
        Pattern = pattern;
        IsFingerStyle = isFingerStyle;
        UserId = userId;
        Description = description;
    }
}
