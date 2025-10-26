using Domain.Entities.Base;
using Domain.ValidationRules.SongRelationRules;

namespace Domain.Entities;

public class SongRelation : BaseEntityWithId
{
    public Guid OriginalSongId { get; private set; }
    public Guid DerivedSongId { get; private set; }
    public string RelationType { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public virtual Song OriginalSong { get; private set; } = null!;
    public virtual Song DerivedSong { get; private set; } = null!;

    private SongRelation()
    {
        RelationType = string.Empty;
    }

    public static SongRelation Create(Guid originalSongId, Guid derivedSongId, string relationType = "Fork")
    {
        SameIdRule.IsValid(originalSongId, derivedSongId);

        var newRelation = new SongRelation();

        newRelation.OriginalSongId = originalSongId;
        newRelation.DerivedSongId = derivedSongId;
        newRelation.RelationType = relationType;
        newRelation.CreatedAt = DateTime.UtcNow;

        return newRelation;
    }
}
