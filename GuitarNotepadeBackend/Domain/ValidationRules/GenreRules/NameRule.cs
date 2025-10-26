using Domain.Exceptions.GenreExceptions;

namespace Domain.ValidationRules.GenreRules;

public static class NameRule
{
    private const int maxNameLength = 50;

    public static void IsValid(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new NameException("Genre name cannot be empty.");
        }
        if(name.Length > maxNameLength)
        {
            throw new NameException($"Genre name is too big, max length = {maxNameLength}.");
        }
    }
}
