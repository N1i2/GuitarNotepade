using Application.Exceptions.Register;
using Application.Features.Commands;
using Domain.Interfaces;

namespace Application.Validations;

static public class RegistrationValidate
{
    public static async Task isValid(RegisterUserCommand request, IUnitOfWork unitOfWork, CancellationToken cancellationToken)
    {
        int minPasswordLength = 6;

        if (await unitOfWork.Users.ExistsByEmailAsync(request.Email, cancellationToken))
        {
            throw new EmailException($"Email ({request.Email}) already exist");
        }

        if (await unitOfWork.Users.ExistsByNikNameAsync(request.NikName, cancellationToken))
        {
            throw new NikNameException($"Nik name ({request.NikName}) already exist");
        }

        if (request.Password.Length < minPasswordLength)
        {
            throw new PasswordException($"The minimum password length is {minPasswordLength} characters.");
        }

        if (request.Password != request.ConfirmPassword)
        {
            throw new PasswordException("Passwords did not happen");
        }
    }
}
