using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class DeleteSongCommandHandler : IRequestHandler<DeleteSongCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteSongCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(DeleteSongCommand request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetQueryable()
            .Include(s => s.Reviews)
            .Include(s => s.Comments)
            .Include(s => s.SongChords)
            .Include(s => s.SongPatterns)
            .FirstOrDefaultAsync(s => s.Id == request.SongId, cancellationToken);

        if (song == null)
            throw new ArgumentException("Song not found", nameof(request.SongId));

        if (song.OwnerId != request.UserId)
            throw new UnauthorizedAccessException("You don't have permission to delete this song");

        await _unitOfWork.Songs.DeleteAsync(song.Id, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}

