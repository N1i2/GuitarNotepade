using Domain.Entities.Base;
using Domain.ValidationRules.AlbumRules;

namespace Domain.Entities;

public class Album : BaseEntityWithId
{
    public string Title { get; private set; }
    public string Description { get; private set; }
    public string? CoverImageUri { get; private set; }
    public Guid OwnerId { get; private set; }
    public bool IsPublic { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    public virtual User Owner { get; private set; } = null!;
    public virtual ICollection<AlbumSong> AlbumSongs { get; private set; } = new List<AlbumSong>();

    private Album()
    {
        Title = string.Empty;
        Description = string.Empty;
        CoverImageUri = null;
    }

    public static Album Create(string title, Guid ownerId, string? description = null, string? coverImageUrl = null, bool isPublic = false)
    {
        TitleRule.IsValid(title);

        var newAlbum = new Album();

        newAlbum.Title = title;
        newAlbum.OwnerId = ownerId;
        newAlbum.IsPublic = isPublic;
        newAlbum.CreatedAt = newAlbum.UpdatedAt = DateTime.UtcNow;

        if (description != null)
        {
            newAlbum.Description = description;
        }
        if (coverImageUrl != null)
        {
            newAlbum.CoverImageUri = coverImageUrl;
        }

        return newAlbum;
    }
    public void Update(string? title = null, string? description = null)
    {
        if (title != null)
        {
            TitleRule.IsValid(title);
            Title = title;
        }
        if (description != null)
        {
            Description = description;
        }

        UpdatedAt = DateTime.UtcNow;
    }
    public void Public() => IsPublic = true;
    public void Private() => IsPublic = false;
    public void UpdateUrl(string? url) => CoverImageUri = url;
}
