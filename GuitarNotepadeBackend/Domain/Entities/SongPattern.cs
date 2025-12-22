using Domain.Entities.Base;

namespace Domain.Entities;

public class SongPattern : BaseEntityWithId
{
    public Guid SongId { get; private set; }
    public Guid StrummingPatternId { get; private set; }

    public virtual Song Song { get; private set; } = null!;
    public virtual StrummingPattern StrummingPattern { get; private set; } = null!;

    protected SongPattern() { }

    public static SongPattern Create(Guid songId, Guid strummingPatternId)
    {
        if (songId == Guid.Empty)
        {
            throw new ArgumentException("SongId is required", nameof(songId));
        }

        if (strummingPatternId == Guid.Empty)
        {
            throw new ArgumentException("StrummingPatternId is required", nameof(strummingPatternId));
        }

        return new SongPattern
        {
            Id = Guid.NewGuid(),
            SongId = songId,
            StrummingPatternId = strummingPatternId
        };
    }
}
