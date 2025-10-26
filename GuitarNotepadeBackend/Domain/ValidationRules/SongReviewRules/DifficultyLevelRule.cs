using Domain.Exceptions.SongReviewExceptions;

namespace Domain.ValidationRules.SongReviewRules;

public static class DifficultyLevelRule
{
    private static readonly List<int> difficultyLevels;

    static DifficultyLevelRule()
    {
        difficultyLevels = new List<int>
        {
            1, 2, 3, 4, 5
        };
    }
    
    public static void IsValid(int difficultyLevel)
    {
        if (!difficultyLevels.Contains(difficultyLevel))
        {
            throw new DifficultyLevelException("Unknow Difficulty Level");
        }
    }
}
