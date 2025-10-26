using Domain.Exceptions.StrummingPatternsExceptions;

namespace Domain.ValidationRules.StrummingPatternsRules;

public static class PatternTyреRule
{
    private const int maxPatternTyреLength = 50;

    public static void IsValid(string patternTyре)
    {
        if (string.IsNullOrWhiteSpace(patternTyре))
        {
            throw new NameException("Strumming Patterns Type cannot be empty.");
        }
        if (patternTyре.Length > maxPatternTyреLength)
        {
            throw new NameException($"Strumming Patterns Type is too big, max length = {maxPatternTyреLength}.");
        }
    }
}
