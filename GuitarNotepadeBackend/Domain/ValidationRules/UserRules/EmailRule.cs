using Domain.Exceptions.UserExceptions;
namespace Domain.ValidationRules.UserRules;

public static class EmailRule
{
    public const string EmailPattern = @"^[^@\s]+@[^@\s]+\.[^@\s]+$";

    public static void IsValid(string email)
    {
        if (string.IsNullOrWhiteSpace(email) ||
               !System.Text.RegularExpressions.Regex.IsMatch(email, EmailPattern))
        {
            throw new EmailException(email);
        }
    }
}
