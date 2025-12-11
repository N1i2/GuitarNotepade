using Application.DTOs.Chords;
using MediatR;

namespace Application.Features.Commands.Chords;

public class CreateChordCommand : IRequest<ChordDto>
{
    public string Name { get; }
    public string Fingering { get; }
    public string? Description { get; }
    public Guid UserId { get; }

    public CreateChordCommand(string name, string fingering, Guid userId, string? description = null)
    {
        Name = name;
        Fingering = fingering;
        UserId = userId;
        Description = description;
    }
}
