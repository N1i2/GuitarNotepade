using Domain.Exceptions.ThemeExceptions;

namespace Domain.ValidationRules.ThemeRules;

public static class NameRule
{
    private const int maxNameLength = 50;

    public static void IsValid(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new NameException("Theme name cannot be empty.");
        }
        if(name.Length > maxNameLength)
        {
            throw new NameException($"Theme name is too big, max length = {maxNameLength}.");
        }
    }
}
