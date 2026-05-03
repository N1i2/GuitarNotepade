using Domain.Exceptions.AlbumExceptions;

namespace Domain.ValidationRules.AlbomRules;

public static class AlbumTitleRule
{
    private const int MinLength = 2;
    private const int MaxLength = 50;

    public static void IsValid(string title)
    {
        if (string.IsNullOrWhiteSpace(title) || title.Trim().Length < MinLength)
        {
            throw new TitleException($"Title is too short, min length = {MinLength}.");
        }

        if (title.Trim().Length > MaxLength)
        {
            throw new TitleException($"Title is too long, max length = {MaxLength}.");
        }
    }
}
