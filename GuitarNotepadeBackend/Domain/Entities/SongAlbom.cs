using Domain.Entities.Base;

namespace Domain.Entities;

public class SongAlbum : BaseEntityWithId
{
    public Guid AlbumId { get; private set; }
    public Guid SongId { get; private set; }

    public virtual Album Album { get; private set; } = null!;
    public virtual Song Song { get; private set; } = null!;

    private SongAlbum() { }

    public static SongAlbum Create(Guid albumId, Guid songId)
    {
        if(albumId == Guid.Empty)
        {
            throw new ArgumentException("AlbumId is required", nameof(songId));
        }
        if (songId == Guid.Empty)
        {
            throw new ArgumentException("SongId is required", nameof(songId));
        }

        var songAlbum = new SongAlbum
        {
            Id = Guid.NewGuid(),
            AlbumId = albumId,
            SongId = songId
        };

        return songAlbum;
    }
}
