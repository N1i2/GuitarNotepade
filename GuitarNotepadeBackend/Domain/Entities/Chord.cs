using Domain.Entities.Base;
using Domain.ValidationRules.ChordsRules;

namespace Domain.Entities;

public class Chord : BaseEntityWithId
{
    public string Name { get; private set; }
    public string Fingering { get; private set; }  
    public string? Description { get; private set; }
    public Guid CreatedByUserId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    public virtual User CreatedBy { get; private set; } = null!;
    public virtual ICollection<SongChord> SongChords { get; private set; } = new List<SongChord>();

    private Chord()
    {
        Name = string.Empty;
        Fingering = string.Empty;
    }

    public static Chord Create(string name, string fingering, Guid createdByUserId, string? description = null)
    {
        NameRule.IsValid(name);
        FingeringRule.IsValid(fingering);

        var chord = new Chord
        {
            Name = name,
            Fingering = fingering,
            Description = description,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        return chord;
    }

    public void Update(string? name = null, string? fingering = null, string? description = null)
    {
        if (name != null)
        {
            NameRule.IsValid(name);
            Name = name;
        }

        if (fingering != null)
        {
            FingeringRule.IsValid(fingering);
            Fingering = fingering;
        }

        if (description != null)
        {
            Description = description;
        }

        UpdatedAt = DateTime.UtcNow;
    }

    public bool IsCreatedBy(Guid userId) => CreatedByUserId == userId;
}