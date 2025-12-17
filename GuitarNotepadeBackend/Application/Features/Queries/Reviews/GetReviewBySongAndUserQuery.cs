using Application.DTOs.Reviews;
using MediatR;

namespace Application.Features.Queries.Reviews;

public class GetReviewBySongAndUserQuery : IRequest<SongReviewDto>
{
    public Guid SongId { get; }
    public Guid UserId { get; }

    public GetReviewBySongAndUserQuery(Guid songId, Guid userId)
    {
        SongId = songId;
        UserId = userId;
    }
}
