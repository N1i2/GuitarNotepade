using AutoMapper;
using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class CreateSongSegmentCommandHandler : IRequestHandler<CreateSongSegmentCommand, SongSegmentDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ISongSegmentService _songSegmentService;

    public CreateSongSegmentCommandHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ISongSegmentService songSegmentService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _songSegmentService = songSegmentService;
    }

    public async Task<SongSegmentDto> Handle(CreateSongSegmentCommand request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetQueryable()
            .Include(s => s.Structure)
                .ThenInclude(st => st.SegmentPositions)
            .FirstOrDefaultAsync(s => s.Id == request.SongId, cancellationToken);

        if (song == null)
            throw new ArgumentException("Song not found", nameof(request.SongId));

        if (song.OwnerId != request.UserId)
            throw new UnauthorizedAccessException("You don't have permission to modify this song");

        var segmentType = Enum.Parse<SegmentType>(request.SegmentData.Type);
        var segmentData = new SongStructure.SegmentData(
            segmentType,
            request.SegmentData.Lyric,
            request.SegmentData.ChordId,
            request.SegmentData.PatternId,
            request.SegmentData.Duration,
            request.SegmentData.Description,
            request.SegmentData.Color,
            request.SegmentData.BackgroundColor);

        var segment = await _songSegmentService.CreateSegmentAsync(
            segmentData.Type,
            segmentData.Lyric,
            segmentData.ChordId,
            segmentData.PatternId,
            segmentData.Duration,
            segmentData.Description,
            segmentData.Color,
            segmentData.BackgroundColor,
            cancellationToken);

        var positionIndex = request.PositionIndex ?? song.Structure.SegmentPositions.Count;
        song.Structure.AddSegmentAtPosition(positionIndex, segmentData, request.RepeatGroup);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        song.UpdateFullText();

        await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var fullSegment = await _unitOfWork.SongSegments.GetQueryable()
            .Include(s => s.Chord)
            .Include(s => s.Pattern)
            .Include(s => s.SegmentLabels)
                .ThenInclude(sl => sl.Label)
            .FirstOrDefaultAsync(s => s.Id == segment.Id, cancellationToken);

        return _mapper.Map<SongSegmentDto>(fullSegment);
    }
}

