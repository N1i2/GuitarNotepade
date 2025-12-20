using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Queries.Songs;

public record GetSongReviewByIdQuery(Guid ReviewId) : IRequest<SongReviewDto>;

