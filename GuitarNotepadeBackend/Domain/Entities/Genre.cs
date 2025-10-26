using Domain.Entities.Base;
using Domain.ValidationRules.GenreRules;

namespace Domain.Entities;

public class Genre : BaseEntityWithId
{
    public string Name { get; private set; }
    public string Description { get; private set; }

    public virtual ICollection<SongGenre> SongGenres { get; private set; } = new List<SongGenre>();

    private Genre()
    {
        Name = string.Empty;
        Description = string.Empty;
    }

    public static Genre Create(string name, string? description = null)
    {
        NameRule.IsValid(name);

        var newGenre = new Genre();

        newGenre.Name = name;

        if (description != null)
        {
            FingerPositionRule.IsValid(description);
            newGenre.Description = description;
        }

        return newGenre;
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
            FingerPositionRule.IsValid(description);
            Description = description;
        }
    }
}
