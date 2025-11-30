using MediatR;

namespace Application.Features.Commands;

public record UpdateUserProfileCommand(
    Guid UserId,
    string? NikName,
    string? Bio) : IRequest<UserProfileDto>;