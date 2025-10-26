using Domain.Entities.Base;
using Domain.ValidationRules.ChordsRules;
using System.Xml.Linq;

namespace Domain.Entities;

public class Chord : BaseEntityWithId
{
    public string Name { get; private set; }
    public string? DiagramImageUri { get; private set; }
    public string FingerPosition { get; private set; }

    public virtual ICollection<SongChord> SongChords { get; private set; } = new List<SongChord>();

    private Chord()
    {
        Name = string.Empty;
        DiagramImageUri = null;
        FingerPosition = string.Empty;
    }

    public static Chord Create(string name, string fingerPosition, string? diagralmageUri = null)
    {
        NameRule.IsValid(name);
        FingerPositionRule.IsValid(fingerPosition);

        var newChords = new Chord();

        newChords.Name = name;
        newChords.FingerPosition = fingerPosition;

        if (diagralmageUri != null)
        {
            newChords.DiagramImageUri = diagralmageUri;
        }

        return newChords;
    }
    public void Update(string? name = null, string? fingerPosition = null)
    {
        if (name != null)
        {
            NameRule.IsValid(name);
            Name = name;
        }
        if (fingerPosition != null)
        {
            FingerPositionRule.IsValid(fingerPosition);

            FingerPosition = fingerPosition;
        }
    }
    public void UpdateUrl(string? url) => DiagramImageUri = url;
}
