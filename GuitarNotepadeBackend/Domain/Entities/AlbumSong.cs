using Domain.Entities.Base;

namespace Domain.Entities;

public class AlbumSong : BaseEntityWithId
{
    public Guid AlbumId { get; private set; }
    public Guid SongId { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime AddedAt { get; private set; }
    public int SortOrder { get; private set; }

    public virtual Album Album { get; private set; } = null!;
    public virtual Song Song { get; private set; } = null!;
    public virtual User User { get; private set; } = null!;

    private AlbumSong() { }

    public static AlbumSong Create(Guid albumId, Guid songId, Guid userId, int sortOrder)
    {
        var newAlbumSong = new AlbumSong();

        newAlbumSong.AlbumId = albumId;
        newAlbumSong.SongId = songId;
        newAlbumSong.UserId = userId;
        newAlbumSong.SortOrder = sortOrder;
        newAlbumSong.AddedAt = DateTime.UtcNow;

        return newAlbumSong;
    }
}
