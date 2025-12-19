using MediatR;

namespace Application.Features.Commands.Songs;

public record CreateSongReviewCommand(
    Guid UserId,
    Guid SongId,
    string ReviewText,
    int? BeautifulLevel,
    int? DifficultyLevel) : IRequest<SongReviewDto>;