using Application.DTOs.StrummingPatterns;
using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Commands.StrummingPatterns;

public class UpdatePatternCommandHandler : IRequestHandler<UpdatePatternCommand, StrummingPatternsDto>
{
    private readonly IPatternService _patternService;

    public UpdatePatternCommandHandler(IPatternService patternService)
    {
        _patternService = patternService;
    }

    public async Task<StrummingPatternsDto> Handle(UpdatePatternCommand request, CancellationToken cancellationToken)
    {
        var pattern = await _patternService.UpdatePatternAsync(
            request.PatternId,
            request.UserId,
            request.Name,
            request.Pattern,
            request.IsFingerStyle,
            request.Description,
            cancellationToken);

        return new StrummingPatternsDto
        {
            Id = pattern.Id,
            Name = pattern.Name,
            Pattern = pattern.Pattern,
            IsFingerStyle = pattern.IsFingerStyle,
            Description = pattern.Description,
            CreatedByUserId = pattern.CreatedByUserId,
            CreatedAt = pattern.CreatedAt,
            UpdatedAt = pattern.UpdatedAt
        };
    }
}