using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Queries.Songs;

public class GetUserReviewForSongQuery : IRequest<SongReviewDto?>
{
    public Guid UserId { get; }
    public Guid SongId { get; }

    public GetUserReviewForSongQuery(Guid userId, Guid songId)
    {
        UserId = userId;
        SongId = songId;
    }
}

