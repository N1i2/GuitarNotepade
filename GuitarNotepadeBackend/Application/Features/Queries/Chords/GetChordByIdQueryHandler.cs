using Application.DTOs.Chords;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Chords;

public class GetChordByIdQueryHandler : IRequestHandler<GetChordByIdQuery, ChordDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetChordByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ChordDto> Handle(GetChordByIdQuery request, CancellationToken cancellationToken)
    {
        var chord = await _unitOfWork.Chords.GetQueryable()
            .Include(c => c.CreatedBy)
            .FirstOrDefaultAsync(c => c.Id == request.ChordId, cancellationToken);

        if (chord == null)
        {
            throw new KeyNotFoundException($"Chord with ID {request.ChordId} not found");
        }

        return new ChordDto
        {
            Id = chord.Id,
            Name = chord.Name,
            Fingering = chord.Fingering,
            Description = chord.Description,
            CreatedByUserId = chord.CreatedByUserId,
            CreatedByNikName = chord.CreatedBy?.NikName,
            CreatedAt = chord.CreatedAt,
            UpdatedAt = chord.UpdatedAt
        };
    }
}
