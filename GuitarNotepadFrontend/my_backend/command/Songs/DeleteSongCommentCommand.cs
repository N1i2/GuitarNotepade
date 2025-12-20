using MediatR;

namespace Application.Features.Commands.Songs;

public record DeleteSongCommentCommand(
    Guid UserId,
    Guid CommentId) : IRequest<bool>;