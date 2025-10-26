using Domain.Entities.Base;

namespace Domain.Entities;

public class SongGenre : BaseEntityWithId
{
    public Guid SongId { get; private set; }
    public Guid GenreId { get; private set; }

    public virtual Song Song { get; private set; } = null!;
    public virtual Genre Genre { get; private set; } = null!;

    private SongGenre() { }

    public static SongGenre Create(Guid songId, Guid genreId)
    {
        var newSongGenre = new SongGenre();

        newSongGenre.SongId = songId;
        newSongGenre.GenreId = genreId;

        return newSongGenre;
    }
}
