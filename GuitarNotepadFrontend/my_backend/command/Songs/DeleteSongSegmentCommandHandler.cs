using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class DeleteSongSegmentCommandHandler : IRequestHandler<DeleteSongSegmentCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteSongSegmentCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(DeleteSongSegmentCommand request, CancellationToken cancellationToken)
    {
        var segment = await _unitOfWork.SongSegments.GetQueryable()
            .Include(s => s.Positions)
                .ThenInclude(sp => sp.Song)
            .FirstOrDefaultAsync(s => s.Id == request.SegmentId, cancellationToken);

        if (segment == null)
            throw new ArgumentException("Segment not found", nameof(request.SegmentId));

        var song = segment.Positions.FirstOrDefault()?.Song;
        if (song == null || song.OwnerId != request.UserId)
            throw new UnauthorizedAccessException("You don't have permission to delete this segment");

        foreach (var position in segment.Positions.ToList())
        {
            song.Structure.RemoveSegmentAtPosition(position.PositionIndex);
        }

        await _unitOfWork.SongSegments.DeleteAsync(segment.Id, cancellationToken);
        
        song.UpdateFullText();
        await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}

