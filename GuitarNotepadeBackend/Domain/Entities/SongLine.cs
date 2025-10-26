using Domain.Entities.Base;
using Domain.ValidationRules.SongLineRules;

namespace Domain.Entities;

public class SongLine : BaseEntityWithId
{
    public Guid SongId { get; private set; }
    public string LineText { get; private set; }
    public int LineNumber { get; private set; }
    public Guid StrummingPatternId { get; private set; }
    public int SortOrder { get; private set; }

    public virtual Song Song { get; private set; } = null!;
    public virtual StrummingPattern StrummingPattern { get; private set; } = null!;
    public virtual ICollection<SongChord> Chords { get; private set; } = new List<SongChord>();

    private SongLine()
    {
        LineText = string.Empty;
    }

    public static SongLine Create(Guid songId, string lineText, int lineNumber, int sortOrder, Guid strummingPatternId)
    {
        LineTextRule.IsValid(lineText);

        var newSongLine = new SongLine();

        newSongLine.SongId = songId;
        newSongLine.LineText = lineText;
        newSongLine.LineNumber = lineNumber;
        newSongLine.SortOrder = sortOrder;
        newSongLine.StrummingPatternId = strummingPatternId;

        return newSongLine;
    }
    public void Update(string? lineText = null, int? lineNumber = null, int? sortOrder = null, Guid? strummingPatternId = null)
    {
        if (lineText != null)
        {
            LineTextRule.IsValid(lineText);
            LineText = lineText;
        }
        if (int.TryParse(lineNumber.ToString(), out int numb))
        {
            LineNumber = numb;
        }
        if (int.TryParse(sortOrder.ToString(), out int order))
        {
            SortOrder = order;
        }
        if (Guid.TryParse(strummingPatternId.ToString(), out Guid patern))
        {
            StrummingPatternId = patern;
        }
    }
}
