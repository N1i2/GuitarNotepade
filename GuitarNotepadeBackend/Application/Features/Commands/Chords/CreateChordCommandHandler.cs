using Application.DTOs.Chords;
using Domain.Common;
using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Commands.Chords;

public class CreateChordCommandHandler : IRequestHandler<CreateChordCommand, ChordDto>
{
    private readonly IChordService _chordService;
    private readonly IUserService _userService;

    public CreateChordCommandHandler(
        IChordService chordService,
        IUserService userService)
    {
        _chordService = chordService;
        _userService = userService;
    }

    public async Task<ChordDto> Handle(CreateChordCommand request, CancellationToken cancellationToken)
    {
        // Проверка лимитов для бесплатных пользователей
        if (!await _userService.CanCreateMoreChordsAsync(request.UserId, cancellationToken))
        {
            throw new InvalidOperationException(
                $"Free users can only create up to {Constants.Limits.FreeUserMaxChords} chords. " +
                "Upgrade to Premium for unlimited creation.");
        }

        var chord = await _chordService.CreateChordAsync(
            request.Name,
            request.Fingering,
            request.UserId,
            request.Description,
            cancellationToken);

        return new ChordDto
        {
            Id = chord.Id,
            Name = chord.Name,
            Fingering = chord.Fingering,
            Description = chord.Description,
            CreatedByUserId = chord.CreatedByUserId,
            CreatedAt = chord.CreatedAt,
            UpdatedAt = chord.UpdatedAt
        };
    }
}