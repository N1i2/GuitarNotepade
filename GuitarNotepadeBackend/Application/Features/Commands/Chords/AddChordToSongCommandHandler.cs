using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Chords;

public class AddChordToSongCommandHandler : IRequestHandler<AddChordToSongCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public AddChordToSongCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(AddChordToSongCommand request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
            throw new ArgumentException("Song not found", nameof(request.SongId));

        if (song.OwnerId != request.UserId)
            throw new UnauthorizedAccessException("You don't have permission to modify this song");

        var chord = await _unitOfWork.Chords.GetByIdAsync(request.ChordId, cancellationToken);
        if (chord == null)
            throw new ArgumentException("Chord not found", nameof(request.ChordId));

        song.AddChord(request.ChordId);

        await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}

