using Domain.Exceptions.AlbumExceptions;

namespace Domain.ValidationRules.AlbumRules;

public static class TitleRule
{
    private const int minLength = 2;
    private const int maxLength = 50;

    public static void IsValid(string title)
    {
        if (string.IsNullOrWhiteSpace(title) || title.Length < minLength)
        {
            throw new NameException($"Title is too shart, min length = {minLength}.");
        }
        if (title.Length > maxLength)
        {
            throw new NameException($"Title is too shart, max length = {maxLength}.");
        }
    }
}
