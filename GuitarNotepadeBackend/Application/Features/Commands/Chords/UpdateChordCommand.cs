using Application.DTOs.Chords;
using MediatR;

namespace Application.Features.Commands.Chords;

public class UpdateChordCommand : IRequest<ChordDto>
{
    public Guid ChordId { get; }
    public Guid UserId { get; }
    public string? Name { get; }
    public string? Fingering { get; }
    public string? Description { get; }

    public UpdateChordCommand(Guid chordId, Guid userId, string? name = null, string? fingering = null, string? description = null)
    {
        ChordId = chordId;
        UserId = userId;
        Name = name;
        Fingering = fingering;
        Description = description;
    }
}