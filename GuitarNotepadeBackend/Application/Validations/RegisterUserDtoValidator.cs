using Application.DTOs;
using Application.Features.Commands.Users;
using FluentValidation;

public class RegisterUserDtoValidator : AbstractValidator<RegisterUserCommand>
{
    public RegisterUserDtoValidator()
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
            .MinimumLength(8).WithMessage("Password must be at least 8 characters long")
            .MaximumLength(100).WithMessage("Password must not exceed 100 characters")
            .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter")
            .Matches(@"[a-z]").WithMessage("Password must contain at least one lowercase letter")
            .Matches(@"\d").WithMessage("Password must contain at least one number")
            .Matches(@"[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?]").WithMessage("Password must contain at least one special character")
            .Must(BeAStrongPassword).WithMessage("Password is too weak or common");

        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.Password).WithMessage("Passwords do not match");
    }

    private bool BeAStrongPassword(string password)
    {
        if (string.IsNullOrEmpty(password))
        {
            return false;
        }

        var weakPasswords = new[]
        {
            "password", "12345678", "qwerty", "admin", "welcome",
            "password1", "123456789", "abc123", "password123",
            "letmein", "monkey", "sunshine", "princess", "azerty"
        };

        if (weakPasswords.Contains(password.ToLower()))
        {
            return false;
        }

        var uniqueChars = password.Distinct().Count();
        if (uniqueChars < 4)
        {
            return false;
        }

        var sequences = new[] { "123", "abc", "qwerty", "password" };
        if (sequences.Any(seq => password.ToLower().Contains(seq)))
        {
            return false;
        }

        return true;
    }
}