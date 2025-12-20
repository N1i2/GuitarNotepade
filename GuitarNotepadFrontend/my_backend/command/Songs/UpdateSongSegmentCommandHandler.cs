using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class UpdateSongSegmentCommandHandler : IRequestHandler<UpdateSongSegmentCommand, SongSegmentDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ISongSegmentService _songSegmentService;

    public UpdateSongSegmentCommandHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ISongSegmentService songSegmentService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _songSegmentService = songSegmentService;
    }

    public async Task<SongSegmentDto> Handle(UpdateSongSegmentCommand request, CancellationToken cancellationToken)
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

        await _songSegmentService.UpdateSegmentAsync(
            request.SegmentId,
            request.Lyric,
            request.ChordId,
            request.PatternId,
            request.Duration,
            request.Description,
            request.Color,
            request.BackgroundColor,
            cancellationToken);

        if (song != null)
        {
            song.UpdateFullText();
            await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updatedSegment = await _unitOfWork.SongSegments.GetQueryable()
            .Include(s => s.Chord)
            .Include(s => s.Pattern)
            .Include(s => s.SegmentLabels)
                .ThenInclude(sl => sl.Label)
            .FirstOrDefaultAsync(s => s.Id == segment.Id, cancellationToken);

        return _mapper.Map<SongSegmentDto>(updatedSegment);
    }
}

