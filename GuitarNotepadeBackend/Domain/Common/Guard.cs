namespace Domain.Common;

public static class Guard
{
    public static void AgainstEmptyGuid(Guid value, string paramName)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException($"{paramName} is required", paramName);
        }
    }

    public static void AgainstNullOrWhiteSpace(string? value, string paramName, string? message = null)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException(message ?? $"{paramName} is required", paramName);
        }
    }
}
