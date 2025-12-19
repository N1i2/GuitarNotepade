using Domain.Interfaces;
using MediatR;

namespace Application.Features.Commands.Chords;

public class RemoveChordFromSongCommandHandler : IRequestHandler<RemoveChordFromSongCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public RemoveChordFromSongCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(RemoveChordFromSongCommand request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
            throw new ArgumentException("Song not found", nameof(request.SongId));

        if (song.OwnerId != request.UserId)
            throw new UnauthorizedAccessException("You don't have permission to modify this song");

        song.RemoveChord(request.ChordId);

        await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}

