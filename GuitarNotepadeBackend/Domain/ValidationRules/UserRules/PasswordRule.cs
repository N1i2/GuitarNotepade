using Domain.Exceptions.UserExceptions;
using System.Text;

namespace Domain.ValidationRules.UserRules;

public static class PasswordRule
{
    public static void IsValid(string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            throw new PasswordHashException("Incorrect Password Hash.");
        }
    }
}
