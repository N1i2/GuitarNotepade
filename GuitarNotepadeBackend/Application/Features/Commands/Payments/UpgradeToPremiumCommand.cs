using Application.DTOs.Payments;
using MediatR;

namespace Application.Features.Commands.Payments;

public record UpgradeToPremiumCommand(
    Guid UserId,
    string PaymentMethod,
    string PaymentToken
) : IRequest<PremiumUpgradeResultDto>;