using Application.Features.Commands.Users;
using FluentValidation;

namespace Application.Validations;

public class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    public RegisterUserCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format")
            .MaximumLength(255).WithMessage("Email must not exceed 255 characters");

        RuleFor(x => x.NikName)
            .NotEmpty().WithMessage("Nickname is required")
            .MinimumLength(3).WithMessage("Nickname must be at least 3 characters long")
            .MaximumLength(100).WithMessage("Nickname must not exceed 100 characters")
            .Matches(@"^[a-zA-Z0-9_]+$").WithMessage("Nickname can only contain letters, numbers and underscores");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters long");

        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.Password).WithMessage("Passwords do not match");
    }
}