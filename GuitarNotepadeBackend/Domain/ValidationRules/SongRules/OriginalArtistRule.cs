using Domain.Exceptions.SongExceptions;

namespace Domain.ValidationRules.SongRules;

public static class OriginalArtistRule
{
    private const int MinLength = 2;
    private const int MaxLength = 50;

    public static void IsValid(string originalArtist)
    {
        if (string.IsNullOrWhiteSpace(originalArtist) || originalArtist.Length < MinLength)
        {
            throw new OriginalArtistException($"Original artist name is too short, min length = {MinLength}.");
        }

        if (originalArtist.Length > MaxLength)
        {
            throw new OriginalArtistException($"Original artist name is too long, max length = {MaxLength}.");
        }
    }
}
