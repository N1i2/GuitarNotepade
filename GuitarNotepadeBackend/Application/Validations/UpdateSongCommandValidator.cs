using Application.Features.Commands.Songs;
using FluentValidation;

namespace Application.Validations;

public class UpdateSongCommandValidator : AbstractValidator<UpdateSongCommand>
{
    public UpdateSongCommandValidator()
    {
        RuleFor(x => x.SongId)
            .NotEmpty().WithMessage("Song is required");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User is required");

        RuleFor(x => x.Dto)
            .NotNull().WithMessage("Update data is required");

        RuleFor(x => x.Dto!.Title)
            .MinimumLength(2).WithMessage("Title must be at least 2 characters")
            .MaximumLength(50).WithMessage("Title must not exceed 50 characters")
            .When(x => x.Dto != null && !string.IsNullOrEmpty(x.Dto.Title));

        RuleFor(x => x.Dto!.Genre)
            .MaximumLength(100).WithMessage("Genre must not exceed 100 characters")
            .When(x => x.Dto != null && !string.IsNullOrEmpty(x.Dto.Genre));

        RuleFor(x => x.Dto!.Theme)
            .MaximumLength(100).WithMessage("Theme must not exceed 100 characters")
            .When(x => x.Dto != null && !string.IsNullOrEmpty(x.Dto.Theme));

        RuleFor(x => x.Dto!.Artist)
            .MaximumLength(200).WithMessage("Artist must not exceed 200 characters")
            .When(x => x.Dto != null && !string.IsNullOrEmpty(x.Dto.Artist));

        RuleFor(x => x.Dto!.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters")
            .When(x => x.Dto != null && !string.IsNullOrEmpty(x.Dto.Description));
    }
}
