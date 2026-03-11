using Application.DTOs.StrummingPatterns;
using Domain.Common;
using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Commands.StrummingPatterns;

public class CreatePatternCommandHandler : IRequestHandler<CreatePatternCommand, StrummingPatternsDto>
{
    private readonly IPatternService _patternService;
    private readonly IUserService _userService;

    public CreatePatternCommandHandler(
        IPatternService patternService,
        IUserService userService)
    {
        _patternService = patternService;
        _userService = userService;
    }

    public async Task<StrummingPatternsDto> Handle(CreatePatternCommand request, CancellationToken cancellationToken)
    {
        // Проверка лимитов для бесплатных пользователей
        if (!await _userService.CanCreateMorePatternsAsync(request.UserId, cancellationToken))
        {
            throw new InvalidOperationException(
                $"Free users can only create up to {Constants.Limits.FreeUserMaxPatterns} patterns. " +
                "Upgrade to Premium for unlimited creation.");
        }

        var pattern = await _patternService.CreatePatternAsync(
            request.Name,
            request.Pattern,
            request.IsFingerStyle,
            request.UserId,
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