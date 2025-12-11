using Application.DTOs;
using MediatR;

namespace Application.Features.Commands.Users;

public record ChangePasswordCommand(
    Guid UserId,
    string CurrentPassword,
    string NewPassword,
    string ConfirmNewPassword) : IRequest<bool>;