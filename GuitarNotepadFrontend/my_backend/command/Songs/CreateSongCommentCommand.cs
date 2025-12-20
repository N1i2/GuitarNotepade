using MediatR;

namespace Application.Features.Commands.Songs;

public record CreateSongCommentCommand(
    Guid UserId,
    Guid SongId,
    string Text,
    Guid? SegmentId) : IRequest<SongCommentDto>;