using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Queries.Songs;

public record GetSongByIdQuery(
    Guid SongId,
    bool IncludeStructure = false,
    bool IncludeChords = false,
    bool IncludePatterns = false,
    bool IncludeReviews = false,
    bool IncludeComments = false) : IRequest<SongDto>;