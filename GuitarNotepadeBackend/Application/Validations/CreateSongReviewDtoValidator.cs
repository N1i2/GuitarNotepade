using Application.DTOs.Song.Comment;
using Domain.Common;
using FluentValidation;

namespace Application.Validations;

public class CreateSongReviewDtoValidator : AbstractValidator<CreateSongReviewDto>
{
    public CreateSongReviewDtoValidator()
    {
        RuleFor(x => x.ReviewText)
            .NotEmpty().WithMessage("Review text is required")
            .MinimumLength(Constants.Review.MinLength)
            .WithMessage($"Review text must be at least {Constants.Review.MinLength} characters")
            .MaximumLength(Constants.Review.MaxLength)
            .WithMessage($"Review text must not exceed {Constants.Review.MaxLength} characters");

        RuleFor(x => x.BeautifulLevel)
            .InclusiveBetween(Constants.Review.MinRating, Constants.Review.MaxRating)
            .WithMessage($"Beautiful level must be between {Constants.Review.MinRating} and {Constants.Review.MaxRating}")
            .When(x => x.BeautifulLevel.HasValue);

        RuleFor(x => x.DifficultyLevel)
            .InclusiveBetween(Constants.Review.MinRating, Constants.Review.MaxRating)
            .WithMessage($"Difficulty level must be between {Constants.Review.MinRating} and {Constants.Review.MaxRating}")
            .When(x => x.DifficultyLevel.HasValue);
    }
}
