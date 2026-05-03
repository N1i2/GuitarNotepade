using Domain.Exceptions.SongExceptions;

namespace Domain.ValidationRules.SongRules;

public static class LyricsRule
{
    private const int MinLength = 10;
    private const int MaxLength = 20000;

    public static void IsValid(string lyrics)
    {
        if (string.IsNullOrWhiteSpace(lyrics) || lyrics.Length < MinLength)
        {
            throw new LyricsException($"Lyrics is too short, min length = {MinLength}.");
        }

        if (lyrics.Length > MaxLength)
        {
            throw new LyricsException($"Lyrics is too long, max length = {MaxLength}.");
        }
    }
}
