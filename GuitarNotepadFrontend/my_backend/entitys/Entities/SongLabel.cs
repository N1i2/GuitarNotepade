using Domain.Entities.Base;

namespace Domain.Entities;

public class SongLabel : BaseEntityWithId
{
    public string Name { get; private set; }
    public string? Color { get; private set; }

    public virtual ICollection<SegmentLabel> SegmentLabels { get; private set; }

    protected SongLabel()
    {
        Name = string.Empty;
        SegmentLabels = new List<SegmentLabel>();
    }

    public static SongLabel Create(string name, string? color = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name is required", nameof(name));

        if (name.Length > 50)
            throw new ArgumentException("Label name is too long", nameof(name));

        return new SongLabel
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            Color = color
        };
    }

    public void Update(string? name = null, string? color = null)
    {
        if (name != null)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Name is required", nameof(name));

            if (name.Length > 50)
                throw new ArgumentException("Label name is too long", nameof(name));

            Name = name.Trim();
        }

        if (color != null)
        {
            Color = color;
        }
    }
}
