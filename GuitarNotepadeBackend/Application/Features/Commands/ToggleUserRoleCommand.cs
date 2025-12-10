using MediatR;

namespace Application.Features.Commands;

public record ToggleUserRoleCommand(
    string Email,
    Guid AdminId):IRequest<Guid>;
