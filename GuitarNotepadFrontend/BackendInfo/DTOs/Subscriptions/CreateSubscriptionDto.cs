namespace Application.DTOs.Subscriptions;

public class CreateSubscriptionDto
{
    public Guid TargetId { get; set; }
    public bool IsUserSub { get; set; }
}
