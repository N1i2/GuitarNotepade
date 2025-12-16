using Domain.Entities.Base;

namespace Domain.Entities;

public class SongPattern : BaseEntityWithId
{
    public Guid SongId { get; private set; }
    public Guid StrummingPatternId { get; private set; }

    public virtual Song Song { get; private set; } = null!;
    public virtual StrummingPattern StrummingPattern { get; private set; } = null!;

    private SongPattern() { }

    public static SongPattern Create(Guid songId, Guid strummingPatternId)
    {
        if (songId == Guid.Empty)
        {
            throw new ArgumentNullException("Song ID cannot be empty", nameof(songId));
        }
        if (strummingPatternId == Guid.Empty)
        {
            throw new ArgumentNullException("Pattern ID cannot be empty", nameof(strummingPatternId));
        }

        return new SongPattern
        {
            SongId = songId,
            StrummingPatternId = strummingPatternId
        };
    }
}
