using Application.DTOs.Chords;
using MediatR;

namespace Application.Features.Queries.Chords;

public class GetChordByIdQuery : IRequest<ChordDto>
{
    public Guid ChordId { get; }

    public GetChordByIdQuery(Guid chordId)
    {
        ChordId = chordId;
    }
}