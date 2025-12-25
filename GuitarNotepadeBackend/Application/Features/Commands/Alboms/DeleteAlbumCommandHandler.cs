using Application.Features.Commands.Alboms;
using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Handlers.Alboms;

public class DeleteAlbumCommandHandler : IRequestHandler<DeleteAlbumCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IWebDavService _webDavService;

    public DeleteAlbumCommandHandler(
        IUnitOfWork unitOfWork,
        IWebDavService webDavService)
    {
        _unitOfWork = unitOfWork;
        _webDavService = webDavService;
    }

    public async Task Handle(DeleteAlbumCommand request, CancellationToken cancellationToken)
    {
        await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            var album = await _unitOfWork.Alboms.GetByIdWithDetailsAsync(request.AlbumId, cancellationToken);
            var user = await _unitOfWork.Users.GetByIdAsync(request.UserId);

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

            if (!string.IsNullOrEmpty(album.CoverUrl))
            {
                await _webDavService.DeleteAlbumCoverAsync(album.CoverUrl);
            }

            var songAlbums = await _unitOfWork.SongAlboms.GetByAlbumIdAsync(album.Id, cancellationToken);
            foreach (var songAlbum in songAlbums)
            {
                await _unitOfWork.SongAlboms.DeleteAsync(songAlbum.Id, cancellationToken);
            }

            await _unitOfWork.Alboms.DeleteAsync(album.Id, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }, cancellationToken);
    }
}