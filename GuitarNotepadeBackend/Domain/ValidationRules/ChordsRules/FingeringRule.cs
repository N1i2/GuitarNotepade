namespace Domain.ValidationRules.ChordsRules;

public static class FingeringRule
{
    public static void IsValid(string fingering)
    {
        if (string.IsNullOrWhiteSpace(fingering))
        {
            throw new ArgumentException("Fingering cannot be empty");
        }

        var parts = fingering.Split('-');

        if (parts.Length != 6)
        {
            throw new ArgumentException("Fingering must have exactly 6 parts separated by hyphens");
        }

        var allowedDigits = new HashSet<char>("0123456789");

        for (int i = 0; i < parts.Length; i++)
        {
            var part = parts[i];

            if (part == "X" || part == "x") continue;

            if (!int.TryParse(part, out int fret))
            {
                throw new ArgumentException($"Invalid fret value '{part}' on string {6 - i}");
            }

            if (fret < 0 || fret > 12)
            {
                throw new ArgumentException($"Fret {fret} on string {6 - i} must be between 0 and 12");
            }
        }

        var allOpenOrMuted = parts.All(p => p == "0" || p.ToUpper() == "X");
        if (allOpenOrMuted)
        {
            throw new ArgumentException("Chord must have at least one fingered position");
        }
    }
}