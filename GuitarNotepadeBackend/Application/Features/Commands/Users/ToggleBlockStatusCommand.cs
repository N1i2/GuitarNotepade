using Application.DTOs.Users;
using MediatR;

namespace Application.Features.Commands.Users;

public class ToggleBlockStatusCommand : IRequest<BlockUserResponseDto>
{
    public string Email { get; }
    public string? Reason { get; }
    public DateTime? BlockedUntil { get; }
    public Guid AdminId { get; }

    public ToggleBlockStatusCommand(string email, Guid adminId)
    {
        Email = email;
        AdminId = adminId;
        Reason = null;
        BlockedUntil = null;
    }

    public ToggleBlockStatusCommand(string email, string reason, DateTime blockedUntil, Guid adminId)
    {
        Email = email;
        Reason = reason;
        BlockedUntil = blockedUntil;
        AdminId = adminId;
    }

    public bool IsBlockAction => Reason != null && BlockedUntil != null;
}