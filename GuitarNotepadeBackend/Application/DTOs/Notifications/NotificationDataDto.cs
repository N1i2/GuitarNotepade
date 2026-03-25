namespace Application.DTOs.Notifications;

public class NotificationDataDto
{
    public string Type { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? AlbumTitle { get; set; }
    public string? SongTitle { get; set; }
    public string? ActorName { get; set; }
}