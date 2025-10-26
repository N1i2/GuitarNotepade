using Domain.Exceptions.ThemeExceptions;

namespace Domain.ValidationRules.ThemeRules;

public static class DescriptionRule
{
    private const int maxNameLength = 255;

    public static void IsValid(string description)
    {
        if (description.Length > maxNameLength)
        {
            throw new DescriptionException($"Theme description is too big, max length = {maxNameLength}.");
        }
    }
}
