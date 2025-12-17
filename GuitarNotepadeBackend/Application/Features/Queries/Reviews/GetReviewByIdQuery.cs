using Application.DTOs.Reviews;
using MediatR;

namespace Application.Features.Queries.Reviews;

public class GetReviewByIdQuery : IRequest<SongReviewDto>
{
    public Guid ReviewId { get; }

    public GetReviewByIdQuery(Guid reviewId)
    {
        ReviewId = reviewId;
    }
}