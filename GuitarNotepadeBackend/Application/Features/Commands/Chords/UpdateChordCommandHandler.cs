using Application.DTOs.Chords;
using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Commands.Chords;

public class UpdateChordCommandHandler : IRequestHandler<UpdateChordCommand, ChordDto>
{
    private readonly IChordService _chordService;

    public UpdateChordCommandHandler(IChordService chordService)
    {
        _chordService = chordService;
    }

    public async Task<ChordDto> Handle(UpdateChordCommand request, CancellationToken cancellationToken)
    {
        var chord = await _chordService.UpdateChordAsync(
            request.ChordId,
            request.UserId,
            request.Name,
            request.Fingering,
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