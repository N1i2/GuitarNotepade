using Domain.Entities.Base;
using Domain.ValidationRules.SongRules;

namespace Domain.Entities;

public class Song : BaseEntityWithId
{
    public Guid OwnerId { get; private set; }
    public string Title { get; private set; }
    public string Lyrics { get; private set; }
    public string OriginalArtist { get; private set; }
    public int DifficultyLevel { get; private set; }
    public bool IsPublic { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    public virtual User Owner { get; private set; } = null!;
    public virtual ICollection<SongLine> SongLines { get; private set; } = new List<SongLine>();
    public virtual ICollection<SongGenre> SongGenres { get; private set; } = new List<SongGenre>();
    public virtual ICollection<SongTheme> SongThemes { get; private set; } = new List<SongTheme>();
    public virtual ICollection<SongReview> Reviews { get; private set; } = new List<SongReview>();
    public virtual ICollection<UserFavoriteSong> FavoriteByUsers { get; private set; } = new List<UserFavoriteSong>();
    public virtual ICollection<SongAudioRecording> AudioRecordings { get; private set; } = new List<SongAudioRecording>();
    public virtual ICollection<AlbumSong> AlbumSongs { get; private set; } = new List<AlbumSong>();
    public virtual ICollection<SongRelation> OriginalSongs { get; private set; } = new List<SongRelation>();
    public virtual ICollection<SongRelation> DerivedSongs { get; private set; } = new List<SongRelation>();
    public virtual ICollection<SongStrummingPattern> SongStrummingPatterns { get; private set; } = new List<SongStrummingPattern>();

    private Song()
    {
        Title = string.Empty;
        Lyrics = string.Empty;
        OriginalArtist = string.Empty;
    }

    public static Song Create(string title, string lyrics, int difficultyLevel, string? originalArtist = null, bool isPublic = false)
    {
        TitleRule.IsValid(title);
        LyricsRule.IsValid(lyrics);
        DifficultyLevelRule.IsValid(difficultyLevel);

        var newSong = new Song();

        newSong.Title = title;
        newSong.Lyrics = lyrics;
        newSong.DifficultyLevel = difficultyLevel;
        newSong.IsPublic = isPublic;
        newSong.CreatedAt = newSong.UpdatedAt = DateTime.UtcNow;

        if (originalArtist != null)
        {
            OriginalArtistRule.IsValid(originalArtist);

            newSong.OriginalArtist = originalArtist;
        }

        return newSong;
    }
    public void Update(string? title = null, string? lyrics = null, int? difficultyLevel = null, string? originalArtist = null)
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
        if (int.TryParse(difficultyLevel.ToString(), out int difficulty))
        {
            DifficultyLevelRule.IsValid(difficulty);
            DifficultyLevel = difficulty;
        }
        if (originalArtist != null)
        {
            OriginalArtistRule.IsValid(originalArtist);
            OriginalArtist = originalArtist;
        }

        UpdatedAt = DateTime.UtcNow;
    }
    public void Public() => IsPublic = true;
    public void Private() => IsPublic = false;
}