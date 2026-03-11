namespace Application.DTOs.Subscriptions;

public class CreateSubscriptionDto
{
    public Guid SubId { get; set; }
    public bool IsUserSub { get; set; }
}
