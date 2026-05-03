using Domain.Exceptions.UserExceptions;

namespace Domain.ValidationRules.UserRules;

public static class NikNameRule
{
    private const int MaxNikNameLength = 50;

    public static void IsValid(string nikName)
    {
        if (string.IsNullOrWhiteSpace(nikName))
        {
            throw new NikNameException($"Nickname is too short, min length = 1.");
        }

        if (nikName.Length > MaxNikNameLength)
        {
            throw new NikNameException($"Nickname is too long, max length = {MaxNikNameLength}.");
        }
    }
}
