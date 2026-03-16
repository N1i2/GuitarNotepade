namespace Application.DTOs.Subscriptions;

public class SubscriptionDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public Guid TargetId { get; set; }
    public string SubName { get; set; } = string.Empty;
    public bool IsUserSub { get; set; }
    public DateTime CreatedAt { get; set; }
}
