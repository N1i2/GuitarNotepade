using Domain.Exceptions.SongLineExceptions;

namespace Domain.ValidationRules.SongLineRules;

public static class LineTextRule
{
    private const int maxLength = 200;

    public static void IsValid(string textLine)
    {
        if(textLine.Length > maxLength)
        {
            throw new LineTextException($"Line Text is too long, max length = {maxLength}.");
        }
    }
}
