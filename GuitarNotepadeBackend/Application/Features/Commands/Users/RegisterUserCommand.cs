using Application.DTOs.Users;
using MediatR;

namespace Application.Features.Commands.Users;

public record RegisterUserCommand(
    string Email,
    string NikName,
    string Password,
    string ConfirmPassword) : IRequest<AuthResponseDto>;
