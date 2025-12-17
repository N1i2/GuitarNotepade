using Application.DTOs.Songs;
using MediatR;

namespace Application.Features.Commands.Songs;

public class UpdateSongCommand : IRequest<SongDto>
{
    public Guid SongId { get; }
    public Guid UserId { get; }
    public string? Title { get; }
    public string? Artist { get; }
    public bool? IsPublic { get; }
    public Domain.Entities.HelpEntitys.SongStructure? Structure { get; }
    public List<Guid>? ChordIds { get; }
    public List<Guid>? PatternIds { get; }

    public UpdateSongCommand(
        Guid songId,
        Guid userId,
        string? title = null,
        string? artist = null,
        bool? isPublic = null,
        Domain.Entities.HelpEntitys.SongStructure? structure = null,
        List<Guid>? chordIds = null,
        List<Guid>? patternIds = null)
    {
        SongId = songId;
        UserId = userId;
        Title = title;
        Artist = artist;
        IsPublic = isPublic;
        Structure = structure;
        ChordIds = chordIds;
        PatternIds = patternIds;
    }
}
