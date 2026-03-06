using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Commands.Songs;

public class UpdateSongReviewCommand : IRequest<SongReviewDto>
{
    public Guid UserId { get; }
    public Guid ReviewId { get; }
    public string? ReviewText { get; }
    public int? BeautifulLevel { get; }
    public int? DifficultyLevel { get; }

    public UpdateSongReviewCommand(
        Guid userId,
        Guid reviewId,
        string? reviewText,
        int? beautifulLevel,
        int? difficultyLevel)
    {
        UserId = userId;
        ReviewId = reviewId;
        ReviewText = reviewText;
        BeautifulLevel = beautifulLevel;
        DifficultyLevel = difficultyLevel;
    }
}

