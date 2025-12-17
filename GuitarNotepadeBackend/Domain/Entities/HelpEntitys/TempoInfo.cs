namespace Domain.Entities.HelpEntitys;

public class TempoInfo
{
    public int Bpm { get; set; } = 120;
    public string TimeSignature { get; set; } = "4/4";
    public string? NoteValue { get; set; } = "quarter";
}