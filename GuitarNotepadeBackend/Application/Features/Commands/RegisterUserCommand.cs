using Application.DTOs;
using MediatR;

namespace Application.Features.Commands;

public record RegisterUserCommand(
    string Email,
    string NikName,
    string Password,
    string ConfirmPassword) : IRequest<AuthResponseDto>;
