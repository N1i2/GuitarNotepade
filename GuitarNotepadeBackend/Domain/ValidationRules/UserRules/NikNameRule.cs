using Domain.Exceptions.UserExceptions;

namespace Domain.ValidationRules.UserRules;

public static class NikNameRule
{
    private const int maxNikNameLength = 50;

    public static void IsValid(string nikName)
    {

        if (string.IsNullOrWhiteSpace(nikName))
        {
            throw new NikNameException("Youe nik name id too small.");
        }
        if (nikName.Length >= maxNikNameLength)
        {
            throw new NikNameException($"Youe nik name id too big, max length = {maxNikNameLength}.");
        }
    }
}
