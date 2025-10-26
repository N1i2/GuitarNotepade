using Domain.Exceptions.GenreExceptions;

namespace Domain.ValidationRules.GenreRules;

public static class FingerPositionRule
{
    private const int maxNameLength = 255;

    public static void IsValid(string description)
    {
        if (description.Length > maxNameLength)
        {
            throw new FingerPositionException($"Genre description is too big, max length = {maxNameLength}.");
        }
    }
}
