using Domain.Entities.Base;
using Domain.ValidationRules.ThemeRules;

namespace Domain.Entities;

public class Theme : BaseEntityWithId
{
    public string Name { get; private set; }
    public string Description { get; private set; }

    public virtual ICollection<SongTheme> SongThemes { get; private set; } = new List<SongTheme>();

    private Theme()
    {
        Name = string.Empty;
        Description = string.Empty;
    }

    public static Theme Create(string name, string? description = null)
    {
        NameRule.IsValid(name);

        var newTheme = new Theme();

        newTheme.Name = name;

        if (description != null)
        {
            DescriptionRule.IsValid(description);
            newTheme.Description = description;
        }

        return newTheme;
    }
    public void Update(string? name = null, string? description = null)
    {
        if (name != null)
        {
            NameRule.IsValid(name);
            Name = name;
        }

        if (description != null)
        {
            DescriptionRule.IsValid(description);
            Description = description;
        }
    }
}
