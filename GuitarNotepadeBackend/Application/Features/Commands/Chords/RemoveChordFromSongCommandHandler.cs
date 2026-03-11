using Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Chords;

public class RemoveChordFromSongCommandHandler : IRequestHandler<RemoveChordFromSongCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<RemoveChordFromSongCommandHandler> _logger;

    public RemoveChordFromSongCommandHandler(
        IUnitOfWork unitOfWork,
        ILogger<RemoveChordFromSongCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<bool> Handle(RemoveChordFromSongCommand request, CancellationToken cancellationToken)
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

            var songChord = await _unitOfWork.SongChords
                .GetBySongAndChordAsync(request.SongId, request.ChordId, cancellationToken);

            if (songChord == null)
            {
                _logger.LogDebug("Chord {ChordId} not found in song {SongId}",
                    request.ChordId, request.SongId);
                return true; 
            }

            await _unitOfWork.SongChords.DeleteAsync(songChord.Id, cancellationToken);

            _logger.LogInformation("Chord {ChordId} removed from song {SongId}",
                request.ChordId, request.SongId);

            return true;

        }, cancellationToken);
    }
}
