using Application.DTOs.Song.Comment;
using Application.Validations;
using Domain.Common;
using FluentValidation.TestHelper;

namespace UnitTests.Validators;

public class CreateSongReviewDtoValidatorTests
{
    private readonly CreateSongReviewDtoValidator _validator = new();

    [Fact]
    public void T12_Review_ValidDto_PassesValidation()
    {
        var dto = new CreateSongReviewDto
        {
            ReviewText = "Great arrangement for beginners.",
            BeautifulLevel = 4,
            DifficultyLevel = 3,
        };

        var result = _validator.TestValidate(dto);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Review_RatingOutOfRange_FailsValidation()
    {
        var dto = new CreateSongReviewDto
        {
            ReviewText = "Valid text here.",
            BeautifulLevel = Constants.Review.MaxRating + 1,
        };

        var result = _validator.TestValidate(dto);

        result.ShouldHaveValidationErrorFor(x => x.BeautifulLevel);
    }
}
