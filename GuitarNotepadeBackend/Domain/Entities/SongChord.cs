using Domain.Common;
using Domain.Entities.Base;

namespace Domain.Entities;

public class SongChord : BaseEntityWithId
{
    public Guid SongId { get; private set; }
    public Guid ChordId { get; private set; }

    public virtual Song Song { get; private set; } = null!;
    public virtual Chord Chord { get; private set; } = null!;

    protected SongChord() { }

    public static SongChord Create(Guid songId, Guid chordId)
    {
        Guard.AgainstEmptyGuid(songId, nameof(songId));
        Guard.AgainstEmptyGuid(chordId, nameof(chordId));

        return new SongChord
        {
            Id = Guid.NewGuid(),
            SongId = songId,
            ChordId = chordId
        };
    }
}
