using Application.DTOs.Reviews;
using MediatR;

namespace Application.Features.Commands.Reviews;

public class CreateReviewCommand : IRequest<SongReviewDto>
{
    public Guid SongId { get; }
    public Guid UserId { get; }
    public string ReviewText { get; }
    public int? BeautifulLevel { get; }
    public int? DifficultyLevel { get; }

    public CreateReviewCommand(
        Guid songId,
        Guid userId,
        string reviewText,
        int? beautifulLevel = null,
        int? difficultyLevel = null)
    {
        SongId = songId;
        UserId = userId;
        ReviewText = reviewText;
        BeautifulLevel = beautifulLevel;
        DifficultyLevel = difficultyLevel;
    }
}
