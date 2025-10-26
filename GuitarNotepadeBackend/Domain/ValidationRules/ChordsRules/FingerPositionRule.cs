using Domain.Exceptions.ChordsExceptions;

namespace Domain.ValidationRules.ChordsRules;

public static class FingerPositionRule
{
    private const int maxNameLength = 255;

    public static void IsValid(string fingerPosition)
    {
        if (fingerPosition.Length > maxNameLength)
        {
            throw new FingerPositionException($"Chords Finger Position is too big, max length = {maxNameLength}.");
        }
    }
}
