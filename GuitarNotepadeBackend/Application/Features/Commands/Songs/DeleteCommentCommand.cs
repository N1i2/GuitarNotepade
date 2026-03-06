using MediatR;

namespace Application.Features.Commands.Songs;

public class DeleteCommentCommand : IRequest
{
    public Guid UserId { get; }
    public Guid SongId { get; }
    public Guid? SegmetId { get; }

    public DeleteCommentCommand(Guid userId, Guid songId, Guid? segmentId = null)
    {
        UserId = userId;
        SongId = songId;
        SegmetId = segmentId;
    }
}
