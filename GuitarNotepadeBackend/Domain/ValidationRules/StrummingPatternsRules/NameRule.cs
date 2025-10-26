using Domain.Exceptions.StrummingPatternsExceptions;

namespace Domain.ValidationRules.StrummingPatternsRules;

public static class NameRule
{
    private const int maxNameLength = 50;

    public static void IsValid(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new NameException("Strumming Patterns name cannot be empty.");
        }
        if (name.Length > maxNameLength)
        {
            throw new NameException($"Strumming Patterns name is too big, max length = {maxNameLength}.");
        }
    }
}
