using MediatR;

namespace Application.Features.Commands.Chords;

public class DeletePatternCommand : IRequest<bool>
{
    public Guid PatternId { get; }
    public Guid UserId { get; }
    public string UserRole { get; }

    public DeletePatternCommand(Guid patternId, Guid userId, string userRole)
    {
        PatternId = patternId;
        UserId = userId;
        UserRole = userRole;
    }
}
