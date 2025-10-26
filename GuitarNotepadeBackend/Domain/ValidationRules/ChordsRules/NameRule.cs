using Domain.Exceptions.ChordsExceptions;

namespace Domain.ValidationRules.ChordsRules;

public static class NameRule
{
    private const int maxNameLength = 50;

    public static void IsValid(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new NameException("Chords name cannot be empty.");
        }
        if(name.Length > maxNameLength)
        {
            throw new NameException($"Chords name is too big, max length = {maxNameLength}.");
        }
    }
}
