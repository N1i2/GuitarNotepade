using Application.DTOs;
using MediatR;

namespace Application.Features.Commands;

public record LoginUserCommand(
    string Email,
    string Password) : IRequest<AuthResponseDto>;
