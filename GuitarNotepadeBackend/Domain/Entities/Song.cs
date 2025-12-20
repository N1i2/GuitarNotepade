using Domain.Common;
using Domain.Entities.Base;
using Domain.ValidationRules.SongRules;
using System.Text;

namespace Domain.Entities;

public class Song : BaseEntityWithId
{
    public string Title { get; private set; }
    public string? Artist { get; private set; }
    public string? Description { get; private set; }
    public bool IsPublic { get; private set; }
    public Guid OwnerId { get; private set; }
    public Guid? ParentSongId { get; private set; }
    public string Genre { get; set; }
    public string Theme { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public string FullText { get; private set; }

    public int ReviewCount { get; private set; }
    public decimal? AverageBeautifulRating { get; private set; }
    public decimal? AverageDifficultyRating { get; private set; }
    public int TotalLikes { get; private set; }
    public int TotalDislikes { get; private set; }

    public virtual User Owner { get; private set; } = null!;
    public virtual Song? ParentSong { get; private set; }
    public virtual SongStructure Structure { get; private set; } = null!;
    public virtual ICollection<Song> ChildSongs { get; private set; }
    public virtual ICollection<SongComment> Comments { get; private set; }
    public virtual ICollection<SongReview> Reviews { get; private set; }
    public virtual ICollection<SongChord> SongChords { get; private set; }
    public virtual ICollection<SongPattern> SongPatterns { get; private set; }

    protected Song()
    {
        Title = string.Empty;
        FullText = string.Empty;
        Theme = string.Empty;
        Genre = string.Empty;
        ChildSongs = new List<Song>();
        Comments = new List<SongComment>();
        Reviews = new List<SongReview>();
        SongChords = new List<SongChord>();
        SongPatterns = new List<SongPattern>();
    }

    public static Song Create(
        Guid ownerId,
        string title,
        bool isPublic,
        string genre,
        string theme,
        string? artist = null,
        string? description = null,
        Guid? parentSongId = null)
    {
        TitleRule.IsValid(title);

        if (!string.IsNullOrWhiteSpace(artist))
        {
            OriginalArtistRule.IsValid(artist);
        }

        var song = new Song
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            Title = title.Trim(),
            Genre = genre,
            Theme = theme,
            Artist = artist?.Trim(),
            Description = description?.Trim(),
            IsPublic = isPublic,
            ParentSongId = parentSongId,
            CreatedAt = DateTime.UtcNow
        };

        song.Structure = SongStructure.Create(song.Id);

        return song;
    }

    public void Update(
        string? title = null,
        string? artist = null,
        string? genre = null, 
        string? theme = null,
        string? description = null,
        bool? isPublic = null)
    {
        if (title != null)
        {
            TitleRule.IsValid(title);
            Title = title.Trim();
        }

        if(genre != null)
        {
            Genre = genre;
        }

        if (theme != null)
        {
            Theme = theme;
        }

        if (artist != null)
        {
            if (string.IsNullOrWhiteSpace(artist))
            {
                Artist = null;
            }
            else
            {
                OriginalArtistRule.IsValid(artist);
                Artist = artist.Trim();
            }
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
        UpdateFullText();
    }

    public void SetFullText(string fullText)
    {
        FullText = fullText;
    }

    public void UpdateFullText()
    {
        var fullTextBuilder = new StringBuilder();

        if (!string.IsNullOrEmpty(Artist))
        {
            fullTextBuilder.Append(Artist).Append(' ');
        }

        fullTextBuilder.Append(Title).Append(' ');

        if (!string.IsNullOrEmpty(Description))
        {
            fullTextBuilder.Append(Description).Append(' ');
        }

        var segmentLyrics = Structure.GetAllSegmentLyrics();
        foreach (var lyric in segmentLyrics)
        {
            fullTextBuilder.Append(lyric).Append(' ');
        }

        FullText = fullTextBuilder.ToString().Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateStatistics()
    {
        ReviewCount = Reviews.Count;

        var beautifulReviews = Reviews.Where(r => r.BeautifulLevel.HasValue).ToList();
        AverageBeautifulRating = beautifulReviews.Any()
            ? (decimal)beautifulReviews.Average(r => r.BeautifulLevel!.Value)
            : null;

        var difficultyReviews = Reviews.Where(r => r.DifficultyLevel.HasValue).ToList();
        AverageDifficultyRating = difficultyReviews.Any()
            ? (decimal)difficultyReviews.Average(r => r.DifficultyLevel!.Value)
            : null;

        TotalLikes = Reviews.Sum(r => r.LikesCount);
        TotalDislikes = Reviews.Sum(r => r.DislikesCount);

        UpdatedAt = DateTime.UtcNow;
    }

    public void AddChord(Guid chordId)
    {
        if (!SongChords.Any(sc => sc.ChordId == chordId))
        {
            var songChord = SongChord.Create(Id, chordId);
            SongChords.Add(songChord);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void RemoveChord(Guid chordId)
    {
        var songChord = SongChords.FirstOrDefault(sc => sc.ChordId == chordId);
        if (songChord != null)
        {
            SongChords.Remove(songChord);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void AddPattern(Guid patternId)
    {
        if (!SongPatterns.Any(sp => sp.StrummingPatternId == patternId))
        {
            var songPattern = SongPattern.Create(Id, patternId);
            SongPatterns.Add(songPattern);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void RemovePattern(Guid patternId)
    {
        var songPattern = SongPatterns.FirstOrDefault(sp => sp.StrummingPatternId == patternId);
        if (songPattern != null)
        {
            SongPatterns.Remove(songPattern);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public bool HasChord(Guid chordId) => SongChords.Any(sc => sc.ChordId == chordId);
    public bool HasPattern(Guid patternId) => SongPatterns.Any(sp => sp.StrummingPatternId == patternId);

    public List<Guid> GetChordIds() => SongChords.Select(sc => sc.ChordId).ToList();
    public List<Guid> GetPatternIds() => SongPatterns.Select(sp => sp.StrummingPatternId).ToList();

    public bool CanAddComment() => Comments.Count < Constants.Limits.MaxCommentsPerSong;

    public void MakePublic() => IsPublic = true;
    public void MakePrivate() => IsPublic = false;
    public void SetParent(Guid? parentSongId) => ParentSongId = parentSongId;

    public static Song CreateFromExisting(Song originalSong, Guid newOwnerId)
    {
        if (originalSong == null)
        {
            throw new ArgumentNullException(nameof(originalSong));
        }

        var newSong = Create(
            ownerId: newOwnerId,
            title: originalSong.Title,
            genre: originalSong.Genre,
            theme: originalSong.Theme,
            isPublic: true,
            artist: originalSong.Artist,
            description: originalSong.Description,
            parentSongId: originalSong.Id);

        return newSong;
    }
}