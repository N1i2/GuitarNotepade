using Application.DTOs.Payments;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Payments;

public class UpgradeToPremiumCommandHandler : IRequestHandler<UpgradeToPremiumCommand, PremiumUpgradeResultDto>
{
    private readonly IUserService _userService;
    private readonly ILogger<UpgradeToPremiumCommandHandler> _logger;

    public UpgradeToPremiumCommandHandler(
        IUserService userService,
        ILogger<UpgradeToPremiumCommandHandler> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    public async Task<PremiumUpgradeResultDto> Handle(UpgradeToPremiumCommand request, CancellationToken cancellationToken)
    {
        var user = await _userService.GetByIdAsync(request.UserId, cancellationToken);
        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID {request.UserId} not found");
        }

        if (user.HasPremium)
        {
            return new PremiumUpgradeResultDto
            {
                Success = true,
                Message = "User is already premium",
                PremiumUntil = DateTime.UtcNow.AddYears(1) 
            };
        }

        bool paymentSuccess = await ProcessPayment(request.PaymentMethod, request.PaymentToken);

        if (!paymentSuccess)
        {
            throw new InvalidOperationException("Payment processing failed");
        }

        await _userService.UpgradeToPremiumAsync(request.UserId, cancellationToken);

        _logger.LogInformation("User {UserId} upgraded to premium", request.UserId);

        return new PremiumUpgradeResultDto
        {
            Success = true,
            Message = "Successfully upgraded to premium",
            PremiumUntil = DateTime.UtcNow.AddYears(1) 
        };
    }

    private async Task<bool> ProcessPayment(string paymentMethod, string paymentToken)
    {
        await Task.CompletedTask;
        return true;
    }
}