using Domain.Entities.Base;
using Domain.ValidationRules.SongRules;

namespace Domain.Entities;

public class Song : BaseEntityWithId
{
    public string Title { get; private set; }
    public string Lyrics { get; private set; }
    public string? Artist { get; private set; }
    public bool  IsPublic { get; private set; }
    public Guid OwnerId { get; private set; }
    public Guid? ParentsSongId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    public virtual User Owner { get; private set; } = null!;
    public virtual Song? ParentSong { get; private set; }  
    public virtual ICollection<Song> ChildSongs { get; private set; } = new List<Song>();  
    public virtual ICollection<SongPattern> Patterns { get; private set; } = new List<SongPattern>();
    public virtual ICollection<SongChord> Chords { get; private set; } = new List<SongChord>();

    private Song()
    {
        Title = string.Empty;
        Lyrics = string.Empty;
    }

    public static Song Create(Guid ownerId, string title, string lyrics, bool isPublic, string? artist = null)
    {
        TitleRule.IsValid(title);
        LyricsRule.IsValid(lyrics);

        var newSong = new Song();

        newSong.OwnerId = ownerId;
        newSong.Title = title;
        newSong.Lyrics = lyrics;
        newSong.IsPublic = isPublic;
        newSong.CreatedAt = DateTime.UtcNow;

        if (artist != null)
        {
            OriginalArtistRule.IsValid(artist);

            newSong.Artist = artist;
        }

        return newSong;
    }

    public void Update(string? title = null, string? lyrics = null, string? artist = null)
    {
        if (title != null)
        {
            TitleRule.IsValid(title);
            Title = title;
        }
        if (lyrics != null)
        {
            LyricsRule.IsValid(lyrics);
            Lyrics = lyrics;
        }
        if(artist != null)
        {
            OriginalArtistRule.IsValid(artist);
            Artist = artist;
        }

        UpdatedAt = DateTime.UtcNow;
    }
    public void Public() => IsPublic = true;
    public void Private() => IsPublic = false;
}