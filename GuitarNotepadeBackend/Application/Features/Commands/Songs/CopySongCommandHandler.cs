using Application.DTOs.Song;
using AutoMapper;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class CopySongCommandHandler : IRequestHandler<CopySongCommand, SongDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CopySongCommandHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<SongDto> Handle(CopySongCommand request, CancellationToken cancellationToken)
    {
        var originalSong = await _unitOfWork.Songs.GetQueryable()
            .Include(s => s.Structure)
                .ThenInclude(st => st.SegmentPositions)
                    .ThenInclude(sp => sp.Segment)
            .Include(s => s.SongChords)
            .Include(s => s.SongPatterns)
            .FirstOrDefaultAsync(s => s.Id == request.OriginalSongId, cancellationToken);

        if (originalSong == null)
            throw new ArgumentException("Original song not found", nameof(request.OriginalSongId));

        if (!originalSong.IsPublic && originalSong.OwnerId != request.UserId)
            throw new UnauthorizedAccessException("You don't have permission to copy this song");

        var newSong = Domain.Entities.Song.CreateFromExisting(originalSong, request.UserId);
        newSong.MakePublic(); 

        await _unitOfWork.Songs.CreateAsync(newSong, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        foreach (var songChord in originalSong.SongChords)
        {
            newSong.AddChord(songChord.ChordId);
        }

        foreach (var songPattern in originalSong.SongPatterns)
        {
            newSong.AddPattern(songPattern.StrummingPatternId);
        }

        if (originalSong.Structure != null && originalSong.Structure.SegmentPositions.Any())
        {
            var segmentPositions = originalSong.Structure.SegmentPositions
                .OrderBy(sp => sp.PositionIndex)
                .ToList();

            foreach (var position in segmentPositions)
            {
                var originalSegment = position.Segment;
                var segmentData = new SongStructure.SegmentData(
                    originalSegment.Type,
                    originalSegment.Lyric,
                    originalSegment.ChordId,
                    originalSegment.PatternId,
                    originalSegment.Duration,
                    originalSegment.Description,
                    originalSegment.Color,
                    originalSegment.BackgroundColor);

                newSong.Structure.AddSegmentAtPosition(
                    position.PositionIndex,
                    segmentData,
                    position.RepeatGroup);
            }
        }

        newSong.UpdateFullText();

        await _unitOfWork.Songs.UpdateAsync(newSong, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var fullSong = await _unitOfWork.Songs.GetQueryable()
            .Include(s => s.Owner)
            .Include(s => s.ParentSong)
            .Include(s => s.Structure)
            .Include(s => s.SongChords)
                .ThenInclude(sc => sc.Chord)
            .Include(s => s.SongPatterns)
                .ThenInclude(sp => sp.StrummingPattern)
            .FirstOrDefaultAsync(s => s.Id == newSong.Id, cancellationToken);

        return _mapper.Map<SongDto>(fullSong);
    }
}

