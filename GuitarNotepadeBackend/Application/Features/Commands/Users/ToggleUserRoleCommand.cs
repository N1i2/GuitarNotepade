using MediatR;

namespace Application.Features.Commands.Users;

public record ToggleUserRoleCommand(
    string Email,
    Guid AdminId) : IRequest<Guid>;
