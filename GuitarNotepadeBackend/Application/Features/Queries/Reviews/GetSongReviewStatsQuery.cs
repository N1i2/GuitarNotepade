using MediatR;

namespace Application.Features.Queries.Reviews;

public class GetSongReviewStatsQuery : IRequest<object>
{
    public Guid SongId { get; }

    public GetSongReviewStatsQuery(Guid songId)
    {
        SongId = songId;
    }
}