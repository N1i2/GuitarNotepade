namespace Application.DTOs.Notifications;

public class NotificationDto
{
    public Guid Id { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsRead { get; set; }
    public Guid? ActorUserId { get; set; }
    public Guid? SongId { get; set; }
    public Guid? AlbumId { get; set; }
}

