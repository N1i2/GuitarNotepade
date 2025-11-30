using Application.DTOs;
using MediatR;

namespace Application.Features.Commands;

public record ChangePasswordCommand(
    Guid UserId,
    string CurrentPassword,
    string NewPassword,
    string ConfirmNewPassword) : IRequest<bool>;