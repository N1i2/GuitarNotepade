using Domain.Entities.Base;

namespace Domain.Entities;

public class SongAudioRecording : BaseEntityWithId
{
    public Guid SongId { get; private set; }
    public Guid UserId { get; private set; }
    public string AudioFileUrl { get; private set; }
    public string Title { get; private set; }
    public DateTime RecordedAt { get; private set; }

    public virtual Song Song { get; private set; } = null!;
    public virtual User User { get; private set; } = null!;

    private SongAudioRecording()
    {
        AudioFileUrl = string.Empty;
        Title = string.Empty;
    }

    public static SongAudioRecording Create(Guid songId, Guid userId, string audioFileUrl, string? title = null)
    {
        if (string.IsNullOrWhiteSpace(audioFileUrl))
        {
            throw new ArgumentException("Audio file URL cannot be empty");
        }

        var newRecording = new SongAudioRecording();

        newRecording.SongId = songId;
        newRecording.UserId = userId;
        newRecording.AudioFileUrl = audioFileUrl;
        newRecording.RecordedAt = DateTime.UtcNow;

        if (title != null)
        {
            newRecording.Title = title;
        }

        return newRecording;
    }
}
