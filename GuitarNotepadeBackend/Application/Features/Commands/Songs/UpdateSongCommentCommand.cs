using MediatR;

namespace Application.Features.Commands.Songs;

public record UpdateSongCommentCommand(
    Guid UserId,
    Guid CommentId,
    string Text) : IRequest<SongCommentDto>;