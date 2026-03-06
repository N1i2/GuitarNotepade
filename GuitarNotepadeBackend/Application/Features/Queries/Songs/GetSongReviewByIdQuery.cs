using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Queries.Songs;

public class GetSongReviewByIdQuery : IRequest<SongReviewDto>
{
    public Guid ReviewId { get; }

    public GetSongReviewByIdQuery(Guid reviewId)
    {
        ReviewId = reviewId;
    }
}

