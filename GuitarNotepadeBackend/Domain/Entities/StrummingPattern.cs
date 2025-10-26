using Domain.Entities.Base;
using Domain.ValidationRules.StrummingPatternsRules;
using System.Xml.Linq;

namespace Domain.Entities;

public class StrummingPattern : BaseEntityWithId
{
    public string Name { get; private set; }
    public string Pattern { get; private set; }
    public string? DiagramImageUrl { get; private set; }
    public string PatternType { get; private set; }

    public virtual ICollection<SongLine> SongLines { get; private set; } = new List<SongLine>();
    public virtual ICollection<SongStrummingPattern> SongStrummingPatterns { get; private set; } = new List<SongStrummingPattern>();

    private StrummingPattern()
    {
        Name = string.Empty;
        Pattern = string.Empty;
        DiagramImageUrl = null;
        PatternType = string.Empty;
    }

    public static StrummingPattern Create(string name, string pattern, string patternTyре, string? diagramlmageUrl = null)
    {
        NameRule.IsValid(name);
        PatternRule.IsValid(pattern);
        PatternTyреRule.IsValid(patternTyре);

        var newStrummingPatterns = new StrummingPattern();

        newStrummingPatterns.Name = name;
        newStrummingPatterns.Pattern = pattern;
        newStrummingPatterns.PatternType = patternTyре;

        if (diagramlmageUrl != null)
        {
            newStrummingPatterns.DiagramImageUrl = diagramlmageUrl;
        }

        return newStrummingPatterns;
    }
    public void Update(string? name = null, string? pattern = null, string? patternTyре = null)
    {
        if (name != null)
        {
            NameRule.IsValid(name);
            Name = name;
        }
        if (pattern != null)
        {
            PatternRule.IsValid(pattern);
            Pattern = pattern;
        }
        if (patternTyре != null)
        {
            PatternTyреRule.IsValid(patternTyре);
            PatternType = patternTyре;
        }
    }
    public void UpdateUrl(string? url) => DiagramImageUrl = url;
}
