using MediatR;

namespace Application.Features.Commands.Songs;

public record CreateSongSegmentCommand(
    Guid UserId,
    Guid SongId,
    SegmentDataDto SegmentData,
    int? PositionIndex,
    string? RepeatGroup) : IRequest<SongSegmentDto>;