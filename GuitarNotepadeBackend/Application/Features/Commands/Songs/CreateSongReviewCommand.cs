using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Commands.Songs;

public class CreateSongReviewCommand : IRequest<SongReviewDto>
{
    public Guid UserId { get; }
    public Guid SongId { get; }
    public string ReviewText { get; }
    public int? BeautifulLevel { get; }
    public int? DifficultyLevel { get; }

    public CreateSongReviewCommand(
        Guid userId,
        Guid songId,
        string reviewText,
        int? beautifulLevel,
        int? difficultyLevel)
    {
        UserId = userId;
        SongId = songId;
        ReviewText = reviewText;
        BeautifulLevel = beautifulLevel;
        DifficultyLevel = difficultyLevel;
    }
}

