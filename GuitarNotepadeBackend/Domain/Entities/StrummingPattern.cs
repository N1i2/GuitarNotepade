using Domain.Entities.Base;
using Domain.ValidationRules.StrummingPatternsRules;
using System.Reflection;
using System.Xml.Linq;

namespace Domain.Entities;

public class StrummingPattern : BaseEntityWithId
{
    public string Name { get; private set; }
    public string Pattern { get; private set; }
    public string? Description { get; private set; }
    public bool IsFingerStyle { get; private set; }
    public Guid CreatedByUserId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    public virtual User CreatedBy { get; private set; } = null!;
    public virtual ICollection<SongLine> SongLines { get; private set; } = new List<SongLine>();
    public virtual ICollection<SongStrummingPattern> SongStrummingPatterns { get; private set; } = new List<SongStrummingPattern>();

    private StrummingPattern()
    {
        Name = string.Empty;
        Pattern = string.Empty;
        Description = string.Empty;
    }

    public static StrummingPattern Create(string name, string pattern, bool isFingerStyle, Guid createByUserId, string? description = null)
    {
        NameRule.IsValid(name);
        PatternRule.IsValid(pattern);


        var newStrummingPatterns = new StrummingPattern
        {
            Name = name,
            Pattern = pattern,
            Description = description,
            IsFingerStyle = isFingerStyle,
            CreatedByUserId = createByUserId,
            CreatedAt = DateTime.UtcNow
        };

        return newStrummingPatterns;
    }

    public void Update(string? name = null, string? pattern = null, bool? isFingerStyle = null, string? description = null)
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
        if(isFingerStyle != null)
        {
            IsFingerStyle = Convert.ToBoolean(isFingerStyle);
        }
        if (!string.IsNullOrEmpty(description))
        {
            Description = description;
        }

        UpdatedAt = DateTime.UtcNow;
    }

    public bool IsCreatedBy(Guid userId) => CreatedByUserId == userId;
}
