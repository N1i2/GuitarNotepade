using Application.DTOs.Subscriptions;
using Domain.Common;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Subscriptions;

public class SubscribeToUserCommandHandler : IRequestHandler<SubscribeToUserCommand, SubscriptionResponseDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserService _userService;
    private readonly ILogger<SubscribeToUserCommandHandler> _logger;

    public SubscribeToUserCommandHandler(
        IUnitOfWork unitOfWork,
        IUserService userService,
        ILogger<SubscribeToUserCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _userService = userService;
        _logger = logger;
    }

    public async Task<SubscriptionResponseDto> Handle(SubscribeToUserCommand request, CancellationToken cancellationToken)
    {
        // Нельзя подписаться на самого себя
        if (request.UserId == request.TargetUserId)
            throw new InvalidOperationException("Cannot subscribe to yourself");

        // Проверяем существование пользователей
        var user = await _userService.GetByIdAsync(request.UserId, cancellationToken);
        if (user == null)
            throw new KeyNotFoundException($"User with ID {request.UserId} not found");

        var targetUser = await _userService.GetByIdAsync(request.TargetUserId, cancellationToken);
        if (targetUser == null)
            throw new KeyNotFoundException($"Target user with ID {request.TargetUserId} not found");

        // Проверяем, не подписан ли уже
        var exists = await _unitOfWork.Subscriptions.ExistsAsync(
            request.UserId,
            request.TargetUserId,
            true,
            cancellationToken);

        if (exists)
            throw new InvalidOperationException("Already subscribed to this user");

        // Проверяем лимит подписок для бесплатных пользователей
        if (user.IsFreeUser)
        {
            var subscriptionsCount = await _unitOfWork.Subscriptions
                .CountUserSubscriptionsAsync(request.UserId, cancellationToken);

            if (subscriptionsCount >= Constants.Limits.FreeUserMaxSubscriptions)
            {
                throw new InvalidOperationException(
                    $"Free users can only subscribe to {Constants.Limits.FreeUserMaxSubscriptions} users. " +
                    "Upgrade to Premium for unlimited subscriptions.");
            }
        }

        // Создаем подписку
        var subscription = Domain.Entities.Subscription.Create(
            request.UserId,
            request.TargetUserId,
            true); // IsUserSub = true

        await _unitOfWork.Subscriptions.CreateAsync(subscription, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "User {UserId} subscribed to user {TargetUserId}",
            request.UserId,
            request.TargetUserId);

        return new SubscriptionResponseDto
        {
            Id = subscription.Id,
            Message = $"Successfully subscribed to {targetUser.NikName}"
        };
    }
}