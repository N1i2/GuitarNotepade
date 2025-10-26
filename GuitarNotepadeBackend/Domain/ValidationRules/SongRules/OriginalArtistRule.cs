using Domain.Exceptions.SongExceptions;

namespace Domain.ValidationRules.SongRules;

public static class OriginalArtistRule
{
    private const int minLength = 2;
    private const int maxLength = 50;

    public static void IsValid(string originalArtist)
    {
        if (string.IsNullOrWhiteSpace(originalArtist) || originalArtist.Length < minLength)
        {
            throw new OriginalArtistException($"Original Artist name is too shart, min length = {minLength}.");
        }
        if (originalArtist.Length > maxLength)
        {
            throw new OriginalArtistException($"Original Artist name is too shart, max length = {maxLength}.");
        }
    }
}
