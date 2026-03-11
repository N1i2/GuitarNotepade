using Domain.Entities;
using Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Chords;

public class AddChordToSongCommandHandler : IRequestHandler<AddChordToSongCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AddChordToSongCommandHandler> _logger;

    public AddChordToSongCommandHandler(
        IUnitOfWork unitOfWork,
        ILogger<AddChordToSongCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<bool> Handle(AddChordToSongCommand request, CancellationToken cancellationToken)
    {
        return await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
            if (song == null)
                throw new ArgumentException("Song not found", nameof(request.SongId));

            if (song.OwnerId != request.UserId)
                throw new UnauthorizedAccessException("You don't have permission to modify this song");

            var chord = await _unitOfWork.Chords.GetByIdAsync(request.ChordId, cancellationToken);
            if (chord == null)
                throw new ArgumentException("Chord not found", nameof(request.ChordId));

            if (song.SongChords.Any(sc => sc.ChordId == request.ChordId))
            {
                _logger.LogDebug("Chord {ChordId} already exists in song {SongId}",
                    request.ChordId, request.SongId);
                return true;
            }

            var songChord = SongChord.Create(request.SongId, request.ChordId);

            await _unitOfWork.SongChords.CreateAsync(songChord, cancellationToken);

            _logger.LogInformation("Chord {ChordId} added to song {SongId}",
                request.ChordId, request.SongId);

            return true;

        }, cancellationToken);
    }
}
