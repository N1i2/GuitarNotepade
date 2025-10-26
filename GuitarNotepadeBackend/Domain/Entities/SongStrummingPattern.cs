using Domain.Entities.Base;

namespace Domain.Entities;

public class SongStrummingPattern : BaseEntityWithId
{
    public Guid SongId { get; private set; }
    public Guid StrummingPatternId { get; private set; }
    public string? PatternDescription { get; private set; }
    public int SortOrder { get; private set; }

    public virtual Song Song { get; private set; } = null!;
    public virtual StrummingPattern StrummingPattern { get; private set; } = null!;

    private SongStrummingPattern()
    {
        PatternDescription = string.Empty;
    }

    public static SongStrummingPattern Create(Guid songId, Guid strummingPatternId, int sortOrder, string? patternDescription = null)
    {
        var newPattern = new SongStrummingPattern();

        newPattern.SongId = songId;
        newPattern.StrummingPatternId = strummingPatternId;
        newPattern.SortOrder = sortOrder;
        newPattern.PatternDescription = patternDescription;

        return newPattern;
    }
}
