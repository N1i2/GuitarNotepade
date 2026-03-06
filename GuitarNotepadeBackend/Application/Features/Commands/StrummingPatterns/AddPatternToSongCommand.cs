using MediatR;

namespace Application.Features.Commands.StrummingPatterns;

public record AddPatternToSongCommand(
    Guid UserId,
    Guid SongId,
    Guid PatternId) : IRequest<bool>;
