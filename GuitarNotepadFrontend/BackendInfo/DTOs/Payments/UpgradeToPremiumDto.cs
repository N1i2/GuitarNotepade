namespace Application.DTOs.Payments;

public class UpgradeToPremiumDto
{
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentToken { get; set; } = string.Empty;
}
