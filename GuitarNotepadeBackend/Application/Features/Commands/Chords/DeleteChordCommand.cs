using MediatR;

namespace Application.Features.Commands.Chords;

public class DeleteChordCommand : IRequest<bool>
{
    public Guid ChordId { get; }
    public Guid UserId { get; }
    public string UserRole { get; }

    public DeleteChordCommand(Guid chordId, Guid userId, string userRole)
    {
        ChordId = chordId;
        UserId = userId;
        UserRole = userRole;
    }
}
