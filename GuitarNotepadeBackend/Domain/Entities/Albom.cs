using Domain.Common;
using Domain.Entities.Base;
using Domain.ValidationRules.AlbomRules;

namespace Domain.Entities;

public class Album : BaseEntityWithId
{
    public string Title { get; private set; }
    public string? CoverUrl { get; private set; }
    public string? Description { get; private set; }
    public bool IsPublic { get; private set; }
    public string? Genre { get; private set; }
    public string? Theme { get; private set; }
    public Guid OwnerId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    public virtual User Owner { get; private set; } = null!;
    public virtual ICollection<Subscription> Subscriptions { get; private set; } = new List<Subscription>();
    public virtual ICollection<SongAlbum> SongAlbums { get; private set; } = new List<SongAlbum>();
    public virtual ICollection<Notification> Notifications { get; private set; } = new List<Notification>();

    private Album()
    {
        Title = string.Empty;
        Genre = string.Empty;
        Theme = string.Empty;
    }

    public static Album Create(
        Guid ownerId,
        string title,
        string? genre = null,
        string? theme = null,
        bool isPublic = false,
        string? coverUrl = null,
        string? description = null)
    {
        AlbumTitleRule.IsValid(title);

        var album = new Album
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            Title = title.Trim(),
            Genre = genre,
            Theme = theme,
            IsPublic = isPublic,
            CoverUrl = coverUrl,
            Description = description?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        return album;
    }

    public void Update(
        string? title = null,
        string? genre = null,
        string? theme = null,
        string? coverUrl = null,
        string? description = null,
        bool? isPublic = null)
    {
        if (title != null)
        {
            AlbumTitleRule.IsValid(title);
            Title = title.Trim();
        }

        if (genre != null)
        {
            Genre = genre;
        }

        if (theme != null)
        {
            Theme = theme;
        }

        if (coverUrl != null)
        {
            CoverUrl = coverUrl;
        }

        if (description != null)
        {
            Description = description.Trim();
        }

        if (isPublic.HasValue)
        {
            IsPublic = isPublic.Value;
        }

        UpdatedAt = DateTime.UtcNow;
    }

    public void AddSong(Guid songId)
    {
        if (!SongAlbums.Any(sa => sa.SongId == songId))
        {
            var songAlbum = SongAlbum.Create(Id, songId);
            SongAlbums.Add(songAlbum);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void RemoveSong(Guid songId)
    {
        var songAlbum = SongAlbums.FirstOrDefault(sa => sa.SongId == songId);
        if (songAlbum != null)
        {
            SongAlbums.Remove(songAlbum);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public IEnumerable<Song> GetSongs()
    {
        return SongAlbums.Select(sa => sa.Song);
    }

    public bool ContainsSong(Guid songId) => SongAlbums.Any(sa => sa.SongId == songId);

    public int SongsCount => SongAlbums.Count;

    public void MakePublic() => IsPublic = true;
    public void MakePrivate() => IsPublic = false;

    public void UpdateCover(string? coverUrl)
    {
        CoverUrl = coverUrl;
        UpdatedAt = DateTime.UtcNow;
    }
}
