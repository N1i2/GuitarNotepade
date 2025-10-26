using Application.Exceptions.Register;
using Application.Features.Commands;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;

namespace Application.Validations;

static public class LoginValidation
{
    public static async Task<User> isValid(LoginUserCommand request, IUnitOfWork unitOfWork, IAuthService authService, CancellationToken cancellationToken)
    {
        var user = await unitOfWork.Users.GetByEmailAsync(request.Email, cancellationToken);

        if (user == null)
        {
            throw new EmailException($"User with this email ({request.Email}) is not exist");
        }

        if (user.IsBlocked)
        {
            throw new EmailException($"User with this email ({request.Email}) is blocked");
        }

        var isValidPassword = await authService.ValidatePasswordAsync(request.Password, user.PasswordHash);

        if (!isValidPassword)
        {
            throw new PasswordException("This password is uncorrect, try again");
        }

        return user;
    }
}
