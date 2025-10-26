using Domain.Exceptions.SongExceptions;

namespace Domain.ValidationRules.SongRules;

public static class LyricsRule
{
    private const int minLength = 10;
    private const int maxLength = 20000;

    public static void IsValid(string lyrics)
    {

        if (string.IsNullOrWhiteSpace(lyrics) || lyrics.Length < minLength)
        {
            throw new LyricsException($"Lyrics is too shart, min length = {minLength}.");
        }
        if (lyrics.Length > 100)
        {
            throw new LyricsException($"Lyrics is too shart, max length = {maxLength}.");
        }
    }
}
