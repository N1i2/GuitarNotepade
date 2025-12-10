using MediatR;

namespace Application.Features.Commands;

public record ToggleBlockStatusCommand(
    string Email,
    Guid adminId): IRequest<Guid>;