using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Alboms;

public class DeleteAlbumCommandHandler : IRequestHandler<DeleteAlbumCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IWebDavService _webDavService;
    private readonly INotificationService _notificationService;

    public DeleteAlbumCommandHandler(
        IUnitOfWork unitOfWork,
        IWebDavService webDavService,
        INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _webDavService = webDavService;
        _notificationService = notificationService;
    }

    public async Task Handle(DeleteAlbumCommand request, CancellationToken cancellationToken)
    {
        await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            var album = await _unitOfWork.Alboms.GetByIdWithDetailsAsync(request.AlbumId, cancellationToken);
            var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);

            if (album == null)
            {
                throw new KeyNotFoundException($"Album with id {request.AlbumId} not found");
            }

            if (user == null || (user.Role != Constants.Roles.Admin && album.OwnerId != request.UserId))
            {
                throw new UnauthorizedAccessException("You don't have permission to delete this album");
            }

            if (album.Title.ToLower() == "favorite")
            {
                throw new InvalidOperationException("Cannot delete the Favorite album");
            }

            var notifications = await _unitOfWork.Notifications
                .GetQueryable()
                .Where(n => n.AlbumId == album.Id)
                .ToListAsync(cancellationToken);

            foreach (var notification in notifications)
            {
                await _unitOfWork.Notifications.DeleteAsync(notification.Id, cancellationToken);
            }

            var subscriptions = await _unitOfWork.Subscriptions
                .GetQueryable()
                .Where(s => s.TargetAlbumId == album.Id)
                .ToListAsync(cancellationToken);

            foreach (var subscription in subscriptions)
            {
                await _unitOfWork.Subscriptions.DeleteAsync(subscription.Id, cancellationToken);
            }

            var songAlbums = await _unitOfWork.SongAlboms.GetByAlbumIdAsync(album.Id, cancellationToken);
            foreach (var songAlbum in songAlbums)
            {
                await _unitOfWork.SongAlboms.DeleteAsync(songAlbum.Id, cancellationToken);
            }

            if (!string.IsNullOrEmpty(album.CoverUrl))
            {
                await _webDavService.DeleteAlbumCoverAsync(album.CoverUrl);
            }

            await _notificationService.NotifyAlbumChangedAsync(
                albumId: album.Id,
                type: NotificationType.AlbumDeleted,
                cancellationToken: cancellationToken);

            await _unitOfWork.Alboms.DeleteAsync(album.Id, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }, cancellationToken);
    }
}