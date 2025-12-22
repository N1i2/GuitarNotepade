using Application.DTOs.Song;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Songs;

public class DeleteSongCommandHandler : IRequestHandler<DeleteSongCommand, bool>
{
    private readonly ISongDeletionService _songDeletionService;
    private readonly ILogger<DeleteSongCommandHandler> _logger;

    public DeleteSongCommandHandler(
        ISongDeletionService songDeletionService,
        ILogger<DeleteSongCommandHandler> logger)
    {
        _songDeletionService = songDeletionService;
        _logger = logger;
    }

    public async Task<bool> Handle(DeleteSongCommand request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Deleting song {SongId} by user {UserId}",
                request.SongId, request.UserId);

            var result = await _songDeletionService.DeleteSongWithAudioAsync(
                request.SongId,
                request.UserId,
                cancellationToken);

            if (result)
            {
                _logger.LogInformation("Song {SongId} deleted successfully by user {UserId}",
                    request.SongId, request.UserId);
            }
            else
            {
                _logger.LogWarning("Failed to delete song {SongId} by user {UserId}",
                    request.SongId, request.UserId);
            }

            return result;
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "User {UserId} is not authorized to delete song {SongId}",
                request.UserId, request.SongId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting song {SongId} by user {UserId}",
                request.SongId, request.UserId);
            throw;
        }
    }
}