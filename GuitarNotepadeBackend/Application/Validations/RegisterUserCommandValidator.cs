using Application.Features.Commands;
using FluentValidation;

public class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    public RegisterUserCommandValidator()
    {
        RuleFor(x => x).SetValidator(new RegisterUserDtoValidator());
    }
}