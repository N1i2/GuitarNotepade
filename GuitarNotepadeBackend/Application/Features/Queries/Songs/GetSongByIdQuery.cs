using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Queries.Songs;

public class GetSongByIdQuery : IRequest<FullSongDto>
{
    public Guid SongId { get; }
    public Guid? UserId { get; }
    public bool IncludeStructure { get; }
    public bool IncludeChords { get; }
    public bool IncludePatterns { get; }
    public bool IncludeReviews { get; }
    public bool IncludeComments { get; }

    public GetSongByIdQuery(
        Guid songId,
        Guid? userId,
        bool includeStructure = false,
        bool includeChords = false,
        bool includePatterns = false,
        bool includeReviews = false,
        bool includeComments = false)
    {
        SongId = songId;
        UserId = userId;
        IncludeStructure = includeStructure;
        IncludeChords = includeChords;
        IncludePatterns = includePatterns;
        IncludeReviews = includeReviews;
        IncludeComments = includeComments;
    }
}

