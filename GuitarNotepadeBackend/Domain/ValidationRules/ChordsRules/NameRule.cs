
namespace Domain.ValidationRules.ChordsRules;

public static class NameRule
{
    public static void IsValid(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Chord name cannot be empty");
        }

        if (name.Length > 20)
        {
            throw new ArgumentException("Chord name cannot exceed 20 characters");
        }
    }
}