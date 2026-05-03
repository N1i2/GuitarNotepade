using Domain.Entities.Base;
using Domain.Common;

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
        Guard.AgainstEmptyGuid(albumId, nameof(albumId));
        Guard.AgainstEmptyGuid(songId, nameof(songId));

        var songAlbum = new SongAlbum
        {
            Id = Guid.NewGuid(),
            AlbumId = albumId,
            SongId = songId
        };

        return songAlbum;
    }
}
