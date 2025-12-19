using MediatR;

namespace Application.Features.Commands.Songs;

public record UpdateSongSegmentCommand(
    Guid UserId,
    Guid SegmentId,
    string? Lyric,
    Guid? ChordId,
    Guid? PatternId,
    int? Duration,
    string? Description,
    string? Color,
    string? BackgroundColor) : IRequest<SongSegmentDto>;