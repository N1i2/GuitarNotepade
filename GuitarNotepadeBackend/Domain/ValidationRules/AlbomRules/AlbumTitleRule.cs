using Domain.Exceptions.UserExceptions;

namespace Domain.ValidationRules.AlbomRules;

public static class AlbumTitleRule
{
    private const int maxNameLength = 50;

    public static void IsValid(string nikName)
    {

        if (string.IsNullOrWhiteSpace(nikName))
        {
            throw new NikNameException("Youe nik name id too small.");
        }
        if (nikName.Length >= maxNameLength)
        {
            throw new NikNameException($"Youe nik name id too big, max length = {maxNameLength}.");
        }
    }
}
