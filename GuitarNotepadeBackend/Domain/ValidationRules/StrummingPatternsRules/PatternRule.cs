using Domain.Exceptions.StrummingPatternsExceptions;

namespace Domain.ValidationRules.StrummingPatternsRules;

public static class PatternRule
{
    private const int maxPatternLength = 255;

    public static void IsValid(string pattern)
    {
        if (string.IsNullOrWhiteSpace(pattern))
        {
            throw new NameException("Strumming Patterns cannot be empty.");
        }
        if (pattern.Length > maxPatternLength)
        {
            throw new NameException($"Strumming Patterns is too big, max length = {maxPatternLength}.");
        }
    }
}
