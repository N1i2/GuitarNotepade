using Domain.Common;
using Domain.Entities.Base;
using Domain.Entities.HelpEntitys;
using Domain.ValidationRules.SongRules;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Domain.Entities;

public class Song : BaseEntityWithId
{
    public string Title { get; private set; }
    public string? Artist { get; private set; }
    public bool IsPublic { get; private set; }
    public Guid OwnerId { get; private set; }
    public Guid? ParentSongId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    public string FullText { get; private set; }
    public string StructureJson { get; private set; }
    public string? CompiledView { get; private set; }

    [JsonIgnore]
    public virtual User Owner { get; private set; }
    [JsonIgnore]
    public virtual Song? ParentSong { get; private set; }
    [JsonIgnore]
    public virtual ICollection<Song> ChildSongs { get; private set; }
    [JsonIgnore]
    public virtual ICollection<SongReview> Reviews { get; private set; }
    [JsonIgnore]
    public virtual ICollection<SongChord> SongChords { get; private set; }
    [JsonIgnore]
    public virtual ICollection<SongPattern> SongPatterns { get; private set; }

    private Song()
    {
        Title = string.Empty;
        FullText = string.Empty;
        StructureJson = "{}";
        Owner = null!;
        ChildSongs = new List<Song>();
        Reviews = new List<SongReview>();
        SongChords = new List<SongChord>();
        SongPatterns = new List<SongPattern>();
    }

    public static Song Create(Guid ownerId, string title, bool isPublic,
        SongStructure? initialStructure = null, string? artist = null)
    {
        TitleRule.IsValid(title);

        var song = new Song
        {
            OwnerId = ownerId,
            Title = title,
            IsPublic = isPublic,
            Artist = artist,
            CreatedAt = DateTime.UtcNow
        };

        song.SetStructure(initialStructure ?? new SongStructure());
        return song;
    }

    public void SetStructure(SongStructure structure)
    {
        var options = new JsonSerializerOptions
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        StructureJson = JsonSerializer.Serialize(structure, options);
        UpdateFullText(structure);
        UpdatedAt = DateTime.UtcNow;
    }

    private void UpdateFullText(SongStructure structure)
    {
        var lyrics = structure.Segments
            .Where(s => s != null && s.Type == SegmentType.Text && !string.IsNullOrEmpty(s.Lyric))
            .SelectMany(s => Enumerable.Repeat(s.Lyric!, Math.Max(1, s.RepeatCount)))
            .ToList();

        var fullTextParts = new List<string>();

        if (!string.IsNullOrEmpty(Artist))
        {
            fullTextParts.Add(Artist);
        }

        if (!string.IsNullOrEmpty(Title))
        {
            fullTextParts.Add(Title);
        }

        if (lyrics.Any())
        {
            fullTextParts.Add(string.Join(" ", lyrics));
        }

        FullText = string.Join(" ", fullTextParts);
    }

    public SongStructure GetStructure()
    {
        if (string.IsNullOrWhiteSpace(StructureJson))
        {
            return new SongStructure();
        }

        try
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                AllowTrailingCommas = true
            };

            var result = JsonSerializer.Deserialize<SongStructure>(StructureJson, options);
            return result ?? new SongStructure();
        }
        catch (JsonException ex)
        {
            Console.WriteLine(ex.Message);
            return new SongStructure();
        }
    }

    public void Update(string? title = null, string? artist = null, bool? isPublic = null)
    {
        if (title != null)
        {
            TitleRule.IsValid(title);
            Title = title.Trim();
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

        if (isPublic.HasValue)
        {
            IsPublic = isPublic.Value;
        }

        UpdatedAt = DateTime.UtcNow;

        if (title != null || artist != null)
        {
            var structure = GetStructure();
            UpdateFullText(structure);
        }
    }

    public void MakePublic() => IsPublic = true;
    public void MakePrivate() => IsPublic = false;
    public void SetParents(Guid? parentsId = null) => ParentSongId = parentsId;
    public int GetReviewsCount() => Reviews.Count;

    public double? GetAverageBeautifulLevel()
    {
        var reviewsWithRating = Reviews
            .Where(r => r.BeautifulLevel.HasValue)
            .ToList();

        return reviewsWithRating.Any()
            ? reviewsWithRating.Average(r => r.BeautifulLevel!.Value)
            : null;
    }

    public double? GetAverageDifficultyLevel()
    {
        var reviewsWithRating = Reviews
            .Where(r => r.DifficultyLevel.HasValue)
            .ToList();

        return reviewsWithRating.Any()
            ? reviewsWithRating.Average(r => r.DifficultyLevel!.Value)
            : null;
    }

    public int GetTotalLikes() => Reviews.Sum(r => r.LikesCount);
    public int GetTotalDislikes() => Reviews.Sum(r => r.DislikesCount);

    public void AddChord(Guid chordId)
    {
        var songChord = SongChord.Create(Id, chordId);
        SongChords.Add(songChord);
        UpdatedAt = DateTime.UtcNow;
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
        var songPattern = SongPattern.Create(Id, patternId);
        SongPatterns.Add(songPattern);
        UpdatedAt = DateTime.UtcNow;
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

    public bool HasChord(Guid chordId)
    {
        return SongChords.Any(sc => sc.ChordId == chordId);
    }

    public bool HasPattern(Guid patternId)
    {
        return SongPatterns.Any(sp => sp.StrummingPatternId == patternId);
    }

    public List<Guid> GetChordIds()
    {
        return SongChords.Select(sc => sc.ChordId).ToList();
    }

    public List<Guid> GetPatternIds()
    {
        return SongPatterns.Select(sp => sp.StrummingPatternId).ToList();
    }
}