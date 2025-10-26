using Domain.Entities.Base;

namespace Domain.Entities;

public class UserFavoriteSong : BaseEntityWithId
{
    public Guid UserId { get; private set; }
    public Guid SongId { get; private set; }
    public DateTime AddedAt { get; private set; }

    public virtual User User { get; private set; } = null!;
    public virtual Song Song { get; private set; } = null!;

    private UserFavoriteSong() { }

    public static UserFavoriteSong Create(Guid userId, Guid songId)
    {
        var newFavorite = new UserFavoriteSong();

        newFavorite.UserId = userId;
        newFavorite.SongId = songId;
        newFavorite.AddedAt = DateTime.UtcNow;

        return newFavorite;
    }
}
