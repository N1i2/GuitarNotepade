using MediatR;

namespace Application.Features.Commands.Songs;

public record UpdateSongReviewCommand(
    Guid UserId,
    Guid ReviewId,
    string? ReviewText,
    int? BeautifulLevel,
    int? DifficultyLevel) : IRequest<SongReviewDto>;