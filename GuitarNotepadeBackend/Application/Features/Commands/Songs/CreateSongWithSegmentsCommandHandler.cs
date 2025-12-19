using Application.DTOs.Song;
using AutoMapper;
using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class CreateSongWithSegmentsCommandHandler : IRequestHandler<CreateSongWithSegmentsCommand, SongDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ISongSegmentService _songSegmentService;
    private readonly ISongCommentService _songCommentService;

    public CreateSongWithSegmentsCommandHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ISongSegmentService songSegmentService,
        ISongCommentService songCommentService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _songSegmentService = songSegmentService;
        _songCommentService = songCommentService;
    }

    public async Task<SongDto> Handle(CreateSongWithSegmentsCommand request, CancellationToken cancellationToken)
    {
        await _unitOfWork.BeginTransactionAsync(cancellationToken);

        try
        {
            var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);
            if (user == null)
                throw new ArgumentException("User not found", nameof(request.UserId));

            if (request.Dto.ParentSongId.HasValue)
            {
                var parentSong = await _unitOfWork.Songs.GetByIdAsync(request.Dto.ParentSongId.Value, cancellationToken);
                if (parentSong == null || !parentSong.IsPublic)
                    throw new ArgumentException("Parent song not found or not public", nameof(request.Dto.ParentSongId));
            }

            var song = Domain.Entities.Song.Create(
                request.UserId,
                request.Dto.Title,
                request.Dto.IsPublic,
                request.Dto.Artist,
                request.Dto.Description,
                request.Dto.ParentSongId);

            song.Update(key: request.Dto.Key, difficulty: request.Dto.Difficulty);

            await _unitOfWork.Songs.CreateAsync(song, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            if (request.Dto.Segments != null && request.Dto.Segments.Any())
            {
                var segmentDataList = new List<SongStructure.SegmentData>();
                var repeatGroups = new Dictionary<int, string>();

                var sortedSegments = request.Dto.Segments.OrderBy(s => s.PositionIndex).ToList();

                for (int i = 0; i < sortedSegments.Count; i++)
                {
                    var segmentDto = sortedSegments[i];
                    var segmentType = Enum.Parse<SegmentType>(segmentDto.SegmentData.Type);

                    var segmentData = new SongStructure.SegmentData(
                        segmentType,
                        segmentDto.SegmentData.Lyric,
                        segmentDto.SegmentData.ChordId,
                        segmentDto.SegmentData.PatternId,
                        segmentDto.SegmentData.Duration,
                        segmentDto.SegmentData.Description,
                        segmentDto.SegmentData.Color,
                        segmentDto.SegmentData.BackgroundColor);

                    segmentDataList.Add(segmentData);

                    if (!string.IsNullOrEmpty(segmentDto.RepeatGroup))
                    {
                        repeatGroups[i] = segmentDto.RepeatGroup;
                    }
                }

                var existingSegments = new List<SongSegment>();
                var segmentManager = new SongSegmentManager(existingSegments);

                foreach (var segmentData in segmentDataList)
                {
                    var segment = segmentManager.GetOrCreateSegment(segmentData);
                    
                    if (segment.Id == Guid.Empty)
                    {
                        segment = await _unitOfWork.SongSegments.CreateAsync(segment, cancellationToken);
                        existingSegments.Add(segment);
                    }
                    else if (!existingSegments.Any(s => s.Id == segment.Id))
                    {
                        existingSegments.Add(segment);
                    }
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);

                song.Structure.SegmentPositions.Clear();
                
                var positionIndex = 0;
                foreach (var segmentData in segmentDataList)
                {
                    var contentHash = SongSegment.CalculateContentHash(
                        segmentData.Lyric,
                        segmentData.ChordId,
                        segmentData.PatternId);
                    
                    var segment = existingSegments.FirstOrDefault(s => s.ContentHash == contentHash);

                    if (segment == null)
                    {
                        segment = await _songSegmentService.CreateSegmentAsync(
                            segmentData.Type,
                            segmentData.Lyric,
                            segmentData.ChordId,
                            segmentData.PatternId,
                            segmentData.Duration,
                            segmentData.Description,
                            segmentData.Color,
                            segmentData.BackgroundColor,
                            cancellationToken);
                        existingSegments.Add(segment);
                        await _unitOfWork.SaveChangesAsync(cancellationToken);
                    }

                    string? repeatGroup = null;
                    if (repeatGroups.ContainsKey(positionIndex))
                    {
                        repeatGroup = repeatGroups[positionIndex];
                    }

                    var position = SongSegmentPosition.Create(
                        songId: song.Id,
                        segmentId: segment.Id,
                        positionIndex: positionIndex,
                        repeatGroup: repeatGroup);

                    song.Structure.SegmentPositions.Add(position);
                    await _unitOfWork.SongSegmentPositions.CreateAsync(position, cancellationToken);
                    positionIndex++;
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);

                var uniqueChordIds = segmentDataList
                    .Where(sd => sd.ChordId.HasValue)
                    .Select(sd => sd.ChordId!.Value)
                    .Distinct()
                    .ToList();

                foreach (var chordId in uniqueChordIds)
                {
                    song.AddChord(chordId);
                }

                var uniquePatternIds = segmentDataList
                    .Where(sd => sd.PatternId.HasValue)
                    .Select(sd => sd.PatternId!.Value)
                    .Distinct()
                    .ToList();

                foreach (var patternId in uniquePatternIds)
                {
                    song.AddPattern(patternId);
                }

                if (request.Dto.SegmentComments != null && request.Dto.SegmentComments.Any())
                {
                    var segmentPositions = song.Structure.SegmentPositions
                        .OrderBy(sp => sp.PositionIndex)
                        .ToList();

                    foreach (var commentGroup in request.Dto.SegmentComments)
                    {
                        var segmentIndex = commentGroup.Key;
                        if (segmentIndex >= 0 && segmentIndex < segmentPositions.Count)
                        {
                            var segmentPosition = segmentPositions[segmentIndex];
                            var segmentId = segmentPosition.SegmentId;

                            foreach (var commentDto in commentGroup.Value)
                            {
                                await _songCommentService.CreateCommentAsync(
                                    song.Id,
                                    commentDto.Text,
                                    segmentId,
                                    cancellationToken);
                            }
                        }
                    }
                }
            }

            song.UpdateFullText();
            await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            var fullSong = await _unitOfWork.Songs.GetQueryable()
                .Include(s => s.Owner)
                .Include(s => s.ParentSong)
                .Include(s => s.Structure)
                    .ThenInclude(st => st.SegmentPositions)
                        .ThenInclude(sp => sp.Segment)
                            .ThenInclude(seg => seg.Chord)
                .Include(s => s.Structure)
                    .ThenInclude(st => st.SegmentPositions)
                        .ThenInclude(sp => sp.Segment)
                            .ThenInclude(seg => seg.Pattern)
                .Include(s => s.SongChords)
                    .ThenInclude(sc => sc.Chord)
                .Include(s => s.SongPatterns)
                    .ThenInclude(sp => sp.StrummingPattern)
                .Include(s => s.Comments)
                .FirstOrDefaultAsync(s => s.Id == song.Id, cancellationToken);

            return _mapper.Map<SongDto>(fullSong);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }
}

