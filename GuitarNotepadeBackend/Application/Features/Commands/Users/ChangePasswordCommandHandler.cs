using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Commands.Users;

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuthService _authService;

    public ChangePasswordCommandHandler(IUnitOfWork unitOfWork, IAuthService authService)
    {
        _unitOfWork = unitOfWork;
        _authService = authService;
    }

    public async Task<bool> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        if (request.NewPassword != request.ConfirmNewPassword)
        {
            throw new Exception("New passwords do not match");
        }

        var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);

        if (user == null)
        {
            throw new Exception("User not found");
        }

        var isCurrentPasswordValid = await _authService.ValidatePasswordAsync(
            request.CurrentPassword, user.PasswordHash);

        if (!isCurrentPasswordValid)
        {
            throw new Exception("Current password is incorrect");
        }

        var newPasswordHash = _authService.HashPassword(request.NewPassword);
        user.ChangePassword(newPasswordHash);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}