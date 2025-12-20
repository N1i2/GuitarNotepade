using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Queries.Songs;

public record GetReviewLikeByIdQuery(Guid LikeId) : IRequest<ReviewLikeDto>;

