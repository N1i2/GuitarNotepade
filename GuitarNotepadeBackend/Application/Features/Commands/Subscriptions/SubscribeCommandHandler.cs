using Application.DTOs.Subscriptions;
using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Subscriptions;

public class SubscribeCommandHandler : IRequestHandler<SubscribeCommand, SubscriptionResponseDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserService _userService;
    private readonly IAlbumService _albumService;
    private readonly ILogger<SubscribeCommandHandler> _logger;

    public SubscribeCommandHandler(
        IUnitOfWork unitOfWork,
        IUserService userService,
        IAlbumService albumService,
        ILogger<SubscribeCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _userService = userService;
        _albumService = albumService;
        _logger = logger;
    }

    public async Task<SubscriptionResponseDto> Handle(SubscribeCommand request, CancellationToken cancellationToken)
    {
        var user = await _userService.GetByIdAsync(request.UserId, cancellationToken);

        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID {request.UserId} not found");
        }

        var album = await _albumService.GetAlbumByIdAsync(request.AlbumId, cancellationToken);

        if (album == null)
        {
            throw new KeyNotFoundException($"Album with ID {request.AlbumId} not found");
        }

        if (album.OwnerId == request.UserId)
        {
            throw new InvalidOperationException("You cannot subscribe to your own album");
        }

        if (!album.IsPublic)
        {
            throw new InvalidOperationException("Cannot subscribe to private album");
        }

        var exists = await _unitOfWork.Subscriptions.ExistsAsync(
            request.UserId,
            request.AlbumId,
            cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException("Already subscribed to this album");
        }

        if (user.IsFreeUser)
        {
            var subscriptionsCount = await _unitOfWork.Subscriptions
                .CountUserSubscriptionsAsync(request.UserId, cancellationToken);

            if (subscriptionsCount >= Constants.Limits.FreeUserMaxSubscriptions)
            {
                throw new InvalidOperationException(
                    $"Free users can only subscribe to {Constants.Limits.FreeUserMaxSubscriptions} items. " +
                    "Upgrade to Premium for unlimited subscriptions.");
            }
        }

        var subscription = Subscription.Create(request.UserId, request.AlbumId);

        await _unitOfWork.Subscriptions.CreateAsync(subscription, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "User {UserId} subscribed to album {AlbumId} - {AlbumTitle}",
            request.UserId,
            album.Id,
            album.Title);

        return new SubscriptionResponseDto
        {
            Id = subscription.Id,
            Message = $"Successfully subscribed to album '{album.Title}'"
        };
    }
}
