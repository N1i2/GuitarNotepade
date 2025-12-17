namespace Domain.ValidationRules.ReviewRules;

public static class BeautifulLevelRule
{
    private const int MinValue = 1;
    private const int MaxValue = 5;

    public static void IsValid(int level)
    {
        if (level < MinValue || level > MaxValue)
        {
            throw new ArgumentException($"Beautiful level must be between {MinValue} and {MaxValue}", nameof(level));
        }
    }
}