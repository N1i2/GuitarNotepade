using Application.DTOs.Users;
using MediatR;

namespace Application.Features.Commands.Users;

public record LoginUserCommand(
    string Email,
    string Password) : IRequest<AuthResponseDto>;
