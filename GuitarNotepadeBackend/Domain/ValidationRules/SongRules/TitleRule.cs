using Domain.Exceptions.SongExceptions;

namespace Domain.ValidationRules.SongRules;

public static class TitleRule
{
    private const int minLength = 2;
    private const int maxLength = 50;

    public static void IsValid(string title)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new TitleException($"Title is too short, min length = {minLength}.");
        }

        var trimmed = title.Trim();
        if (trimmed.Length < minLength)
        {
            throw new TitleException($"Title is too short, min length = {minLength}.");
        }

        if (trimmed.Length > maxLength)
        {
            throw new TitleException($"Title is too long, max length = {maxLength}.");
        }
    }
}
