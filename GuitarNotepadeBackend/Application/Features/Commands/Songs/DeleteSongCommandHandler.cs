using Domain.Common;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Songs;

public class DeleteSongCommandHandler : IRequestHandler<DeleteSongCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISongDeletionService _songDeletionService;
    private readonly ILogger<DeleteSongCommandHandler> _logger;

    public DeleteSongCommandHandler(
        IUnitOfWork unitOfWork,
        ISongDeletionService songDeletionService,
        ILogger<DeleteSongCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _songDeletionService = songDeletionService;
        _logger = logger;
    }

    public async Task Handle(DeleteSongCommand request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
        {
            throw new KeyNotFoundException($"Song with id {request.SongId} not found");
        }

        if (song.OwnerId != request.UserId && request.UserRole != Constants.Roles.Admin)
        {
            throw new UnauthorizedAccessException("You do not have permission to delete this song");
        }

        await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            var deleted = await _songDeletionService.DeleteSongWithAudioAsync(
                request.SongId,
                request.UserId,
                cancellationToken);

            if (!deleted)
            {
                throw new InvalidOperationException("Failed to delete song");
            }

            _logger.LogInformation("Song deleted successfully: {SongId} by user {UserId}",
                request.SongId, request.UserId);

            return Task.CompletedTask;
        }, cancellationToken);
    }
}
