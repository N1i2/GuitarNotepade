using MediatR;

namespace Application.Features.Queries.Songs;

public record GetSongStatisticsQuery(
    Guid SongId) : IRequest<SongStatisticsDto>;