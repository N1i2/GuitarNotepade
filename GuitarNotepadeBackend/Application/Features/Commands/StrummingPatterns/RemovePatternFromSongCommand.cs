using MediatR;

namespace Application.Features.Commands.StrummingPatterns;

public record RemovePatternFromSongCommand(
    Guid UserId,
    Guid SongId,
    Guid PatternId) : IRequest<bool>;
