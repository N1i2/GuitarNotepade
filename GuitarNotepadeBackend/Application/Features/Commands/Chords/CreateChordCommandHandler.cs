using Application.DTOs.Chords;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Commands.Chords;

public class CreateChordCommandHandler : IRequestHandler<CreateChordCommand, ChordDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateChordCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ChordDto> Handle(CreateChordCommand request, CancellationToken cancellationToken)
    {
        var exists = await _unitOfWork.Chords.ExistsWithSameFingeringAsync(
            request.Name,
            request.Fingering,
            cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException($"Chord '{request.Name}' with fingering '{request.Fingering}' already exists");
        }

        var chord = Chord.Create(
            request.Name,
            request.Fingering,
            request.UserId,
            request.Description);

        await _unitOfWork.Chords.CreateNewAsync(chord, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(chord);
    }

    private ChordDto MapToDto(Chord chord)
    {
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
