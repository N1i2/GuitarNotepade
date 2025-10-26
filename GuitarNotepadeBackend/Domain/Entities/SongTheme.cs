using Domain.Entities.Base;

namespace Domain.Entities;

public class SongTheme : BaseEntityWithId
{
    public Guid SongId { get; private set; }
    public Guid ThemeId { get; private set; }

    public virtual Song Song { get; private set; } = null!;
    public virtual Theme Theme { get; private set; } = null!;

    private SongTheme() { }

    public static SongTheme Create(Guid songId, Guid themeId)
    {
        var newSongTheme = new SongTheme();

        newSongTheme.SongId = songId;
        newSongTheme.ThemeId = themeId;

        return newSongTheme;
    }
}
