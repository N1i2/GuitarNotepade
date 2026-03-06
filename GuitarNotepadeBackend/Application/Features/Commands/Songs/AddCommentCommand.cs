using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Commands.Songs;

public class AddCommentCommand : IRequest<SongCommentDto>
{
    public Guid UserId { get; }
    public Guid SongId { get; }
    public string Text { get; }
    public Guid? SegmentId { get; }

    public AddCommentCommand(Guid userId, Guid songId, string text, Guid? segmentId = null)
    {
        UserId = userId;
        SongId = songId;
        Text = text;
        SegmentId = segmentId;
    }
}
