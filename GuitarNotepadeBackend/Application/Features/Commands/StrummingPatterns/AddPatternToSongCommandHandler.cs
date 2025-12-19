using Domain.Interfaces;
using MediatR;

namespace Application.Features.Commands.StrummingPatterns;

public class AddPatternToSongCommandHandler : IRequestHandler<AddPatternToSongCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public AddPatternToSongCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(AddPatternToSongCommand request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
            throw new ArgumentException("Song not found", nameof(request.SongId));

        if (song.OwnerId != request.UserId)
            throw new UnauthorizedAccessException("You don't have permission to modify this song");

        var pattern = await _unitOfWork.StrummingPatterns.GetByIdAsync(request.PatternId, cancellationToken);
        if (pattern == null)
            throw new ArgumentException("Pattern not found", nameof(request.PatternId));

        song.AddPattern(request.PatternId);

        await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}

