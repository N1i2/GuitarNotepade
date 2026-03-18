namespace Application.DTOs.Payments;

public class PremiumUpgradeResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime? PremiumUntil { get; set; }
}
