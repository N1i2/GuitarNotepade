using Application.DTOs.Reviews;
using MediatR;

namespace Application.Features.Commands.Reviews;

public class UpdateReviewCommand : IRequest<SongReviewDto>
{
    public Guid ReviewId { get; }
    public Guid UserId { get; }
    public string? ReviewText { get; }
    public int? BeautifulLevel { get; }
    public int? DifficultyLevel { get; }

    public UpdateReviewCommand(
        Guid reviewId,
        Guid userId,
        string? reviewText,
        int? beautifulLevel = null,
        int? difficultyLevel = null)
    {
        ReviewId = reviewId;
        UserId = userId;
        ReviewText = reviewText;
        BeautifulLevel = beautifulLevel;
        DifficultyLevel = difficultyLevel;
    }
}