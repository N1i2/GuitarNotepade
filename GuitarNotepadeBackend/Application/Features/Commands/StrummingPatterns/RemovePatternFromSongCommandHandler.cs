using Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.StrummingPatterns;

public class RemovePatternFromSongCommandHandler : IRequestHandler<RemovePatternFromSongCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<RemovePatternFromSongCommandHandler> _logger;

    public RemovePatternFromSongCommandHandler(
        IUnitOfWork unitOfWork,
        ILogger<RemovePatternFromSongCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<bool> Handle(RemovePatternFromSongCommand request, CancellationToken cancellationToken)
    {
        return await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
            if (song == null)
            {
                throw new ArgumentException("Song not found", nameof(request.SongId));
            }

            if (song.OwnerId != request.UserId)
            {
                throw new UnauthorizedAccessException("You don't have permission to modify this song");
            }

            var songPattern = await _unitOfWork.SongPatterns
                .GetBySongAndPatternAsync(request.SongId, request.PatternId, cancellationToken);

            if (songPattern == null)
            {
                _logger.LogDebug("Pattern {PatternId} not found in song {SongId}",
                    request.PatternId, request.SongId);
                return true; 
            }

            await _unitOfWork.SongPatterns.DeleteAsync(songPattern.Id, cancellationToken);

            _logger.LogInformation("Pattern {PatternId} removed from song {SongId}",
                request.PatternId, request.SongId);

            return true;

        }, cancellationToken);
    }
}
