using Application.Features.Commands.Users;
using FluentValidation;

public class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    public RegisterUserCommandValidator()
    {
        RuleFor(x => x).SetValidator(new RegisterUserDtoValidator());
    }
}