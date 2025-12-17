using Application.DTOs.Songs;
using MediatR;

namespace Application.Features.Commands.Songs;

public class CreateSongCommand : IRequest<SongDto>
{
    public string Title { get; }
    public string? Artist { get; }
    public bool IsPublic { get; }
    public Guid OwnerId { get; }
    public Guid? ParentSongId { get; }
    public Domain.Entities.HelpEntitys.SongStructure? Structure { get; }
    public List<Guid>? ChordIds { get; }
    public List<Guid>? PatternIds { get; }

    public CreateSongCommand(
        string title,
        string? artist,
        bool isPublic,
        Guid ownerId,
        Guid? parentSongId = null,
        Domain.Entities.HelpEntitys.SongStructure? structure = null,
        List<Guid>? chordIds = null,
        List<Guid>? patternIds = null)
    {
        Title = title;
        Artist = artist;
        IsPublic = isPublic;
        OwnerId = ownerId;
        ParentSongId = parentSongId;
        Structure = structure;
        ChordIds = chordIds;
        PatternIds = patternIds;
    }
}

