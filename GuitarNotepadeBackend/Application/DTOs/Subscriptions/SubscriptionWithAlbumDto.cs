using Application.DTOs.Alboms;

namespace Application.DTOs.Subscriptions;

public class SubscriptionWithAlbumDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public Guid TargetId { get; set; }
    public string TargetName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public AlbumDto Album { get; set; } = new();
}