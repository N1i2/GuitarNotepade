using Domain.Exceptions.StrummingPatternsExceptions;

namespace Domain.ValidationRules.StrummingPatternsRules;

public static class PatternRule
{
    private const int MaxPatternLength = 255;

    public static void IsValid(string pattern)
    {
        if (string.IsNullOrWhiteSpace(pattern))
        {
            throw new PatternException("Strumming pattern cannot be empty.");
        }

        if (pattern.Length > MaxPatternLength)
        {
            throw new PatternException($"Strumming pattern is too long, max length = {MaxPatternLength}.");
        }
    }
}
