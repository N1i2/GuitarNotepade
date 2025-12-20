using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class AddLabelToSegmentCommandHandler : IRequestHandler<AddLabelToSegmentCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISongSegmentService _songSegmentService;

    public AddLabelToSegmentCommandHandler(
        IUnitOfWork unitOfWork,
        ISongSegmentService songSegmentService)
    {
        _unitOfWork = unitOfWork;
        _songSegmentService = songSegmentService;
    }

    public async Task<bool> Handle(AddLabelToSegmentCommand request, CancellationToken cancellationToken)
    {
        var segment = await _unitOfWork.SongSegments.GetQueryable()
            .Include(s => s.Positions)
                .ThenInclude(sp => sp.Song)
            .FirstOrDefaultAsync(s => s.Id == request.SegmentId, cancellationToken);

        if (segment == null)
            throw new ArgumentException("Segment not found", nameof(request.SegmentId));

        var song = segment.Positions.FirstOrDefault()?.Song;
        if (song == null || song.OwnerId != request.UserId)
            throw new UnauthorizedAccessException("You don't have permission to modify this segment");

        var label = await _unitOfWork.SongLabels.GetByIdAsync(request.LabelId, cancellationToken);
        if (label == null)
            throw new ArgumentException("Label not found", nameof(request.LabelId));

        await _songSegmentService.AddLabelToSegmentAsync(
            request.SegmentId,
            request.LabelId,
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}

