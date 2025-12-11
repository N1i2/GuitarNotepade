using Application.DTOs.Chords;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Commands.Chords;

public class UpdateChordCommandHandler : IRequestHandler<UpdateChordCommand, ChordDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateChordCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ChordDto> Handle(UpdateChordCommand request, CancellationToken cancellationToken)
    {
        var chord = await _unitOfWork.Chords.GetByIdAsync(request.ChordId, cancellationToken);

        if (chord == null)
        {
            throw new KeyNotFoundException($"Chord with ID {request.ChordId} not found");
        }

        if (!chord.IsCreatedBy(request.UserId))
        {
            throw new UnauthorizedAccessException("You can only update chords created by you");
        }

        if (!string.IsNullOrEmpty(request.Fingering) && chord.Fingering != request.Fingering)
        {
            var exists = await _unitOfWork.Chords.ExistsWithSameFingeringAsync(
                request.Name ?? chord.Name,
                request.Fingering,
                cancellationToken);

            if (exists)
            {
                throw new InvalidOperationException($"Chord with this fingering already exists");
            }
        }

        chord.Update(request.Name, request.Fingering, request.Description);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(chord);
    }

    private ChordDto MapToDto(Domain.Entities.Chord chord)
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
