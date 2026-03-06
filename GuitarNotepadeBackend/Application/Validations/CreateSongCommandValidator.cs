using Application.Features.Commands.Songs;
using Domain.Common;
using FluentValidation;

namespace Application.Validations;

public class CreateSongCommandValidator : AbstractValidator<CreateSongCommand>
{
    public CreateSongCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MinimumLength(2).WithMessage("Title must be at least 2 characters")
            .MaximumLength(50).WithMessage("Title must not exceed 50 characters");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User is required");

        RuleFor(x => x.Genre)
            .MaximumLength(100).WithMessage("Genre must not exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.Genre));

        RuleFor(x => x.Theme)
            .MaximumLength(100).WithMessage("Theme must not exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.Theme));

        RuleFor(x => x.Artist)
            .MaximumLength(200).WithMessage("Artist must not exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.Artist));

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}
