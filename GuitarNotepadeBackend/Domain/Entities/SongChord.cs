using Domain.Entities.Base;
using System;

namespace Domain.Entities;

public class SongChord : BaseEntityWithId
{
    public Guid SongLineId { get; private set; }
    public Guid ChordId { get; private set; }
    public int PositionInLine { get; private set; }
    public string? ChordVariation { get; private set; }

    public virtual SongLine SongLine { get; private set; } = null!;
    public virtual Chord Chord { get; private set; } = null!;

    private SongChord() { }

    public static SongChord Create(Guid songLineId, Guid chordId, int positionInLine, string? chordVariation = null)
    {
        var newSongChord = new SongChord();

        newSongChord.SongLineId = songLineId;
        newSongChord.ChordId = chordId;
        newSongChord.PositionInLine = positionInLine;
        newSongChord.ChordVariation = chordVariation;

        return newSongChord;
    }
    public void ChordVariationUpdate(string? chordVariation) => ChordVariation = chordVariation;
}
