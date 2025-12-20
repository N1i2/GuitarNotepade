using MediatR;

namespace Application.Features.Queries.Songs;

public record GetSongLabelsQuery(
    Guid SongId) : IRequest<List<SongLabelDto>>;