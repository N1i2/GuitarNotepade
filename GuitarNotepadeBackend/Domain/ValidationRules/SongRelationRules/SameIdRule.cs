using Domain.Exceptions.SongRelationExceptions;

namespace Domain.ValidationRules.SongRelationRules;

public static class SameIdRule
{
    public static void IsValid(Guid originalSongId, Guid derivedSongId)
    {
        if (originalSongId == derivedSongId)
        {
            throw new SameIdException("Derived Song id and Original Song Id cannot be same.");
        }
    }
}
