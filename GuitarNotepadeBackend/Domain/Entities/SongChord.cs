using Domain.Entities.Base;
using System;

namespace Domain.Entities;

public class SongChord : BaseEntityWithId
{
    public Guid SongId { get; private set; }
    public Guid ChordId { get; private set; }

    public virtual Song Song { get; private set; } = null!;
    public virtual Chord Chord { get; private set; } = null!;

    private SongChord() { }

    public static SongChord Create(Guid songId, Guid chordId)
    {
        if(songId == Guid.Empty)
        {
            throw new ArgumentNullException("Song ID cannot be empty", nameof(songId));
        }
        if (chordId == Guid.Empty)
        {
            throw new ArgumentNullException("Chord ID cannot be empty", nameof(chordId));
        }

        return new SongChord
        {
            SongId = songId,
            ChordId = chordId
        };
    }
}
