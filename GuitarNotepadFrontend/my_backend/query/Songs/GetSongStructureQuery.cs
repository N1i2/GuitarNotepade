using MediatR;

namespace Application.Features.Queries.Songs;

public record GetSongStructureQuery(
    Guid SongId) : IRequest<SongStructureDto>;