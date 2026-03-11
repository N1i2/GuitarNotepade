using Application.DTOs.Payments;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Payments;

public class UpgradeToPremiumCommandHandler : IRequestHandler<UpgradeToPremiumCommand, PremiumUpgradeResultDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserService _userService;
    private readonly ILogger<UpgradeToPremiumCommandHandler> _logger;

    public UpgradeToPremiumCommandHandler(
        IUnitOfWork unitOfWork,
        IUserService userService,
        ILogger<UpgradeToPremiumCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _userService = userService;
        _logger = logger;
    }

    public async Task<PremiumUpgradeResultDto> Handle(UpgradeToPremiumCommand request, CancellationToken cancellationToken)
    {
        var user = await _userService.GetByIdAsync(request.UserId, cancellationToken);
        if (user == null)
            throw new KeyNotFoundException($"User with ID {request.UserId} not found");

        // Проверяем, не премиум ли уже
        if (user.IsPremium)
        {
            return new PremiumUpgradeResultDto
            {
                Success = true,
                Message = "User is already premium",
                PremiumUntil = DateTime.UtcNow.AddYears(1) // Заглушка
            };
        }

        // Здесь должна быть интеграция с реальной платежной системой
        bool paymentSuccess = await ProcessPayment(request.PaymentMethod, request.PaymentToken);

        if (!paymentSuccess)
        {
            throw new InvalidOperationException("Payment processing failed");
        }

        // Обновляем роль пользователя
        await _userService.UpgradeToPremiumAsync(request.UserId, cancellationToken);

        _logger.LogInformation("User {UserId} upgraded to premium", request.UserId);

        return new PremiumUpgradeResultDto
        {
            Success = true,
            Message = "Successfully upgraded to premium",
            PremiumUntil = DateTime.UtcNow.AddYears(1) // Заглушка - на 1 год
        };
    }

    private async Task<bool> ProcessPayment(string paymentMethod, string paymentToken)
    {
        // Заглушка - всегда успешно
        await Task.CompletedTask;
        return true;
    }
}