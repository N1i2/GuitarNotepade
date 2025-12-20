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
        try
        {
            var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);
            if (user == null)
            {
                throw new ArgumentException("User not found", nameof(request.UserId));
            }

            if (request.Dto.ParentSongId.HasValue)
            {
                var parentSong = await _unitOfWork.Songs.GetByIdAsync(request.Dto.ParentSongId.Value, cancellationToken);
                if (parentSong == null || !parentSong.IsPublic)
                {
                    throw new ArgumentException("Parent song not found or not public", nameof(request.Dto.ParentSongId));
                }
            }

            var song = Song.Create(
                request.UserId,
                request.Dto.Title,
                request.Dto.IsPublic,
                request.Dto.Genre,
                request.Dto.Theme,
                request.Dto.Artist,
                request.Dto.Description,
                request.Dto.ParentSongId);

            await _unitOfWork.Songs.AddAsync(song, cancellationToken);

            await _unitOfWork.SongStructures.AddAsync(song.Structure, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken); 

            if (request.Dto.Segments != null && request.Dto.Segments.Any())
            {
                var segmentDataList = new List<SongStructure.SegmentData>();
                var repeatGroups = new Dictionary<int, string>();

                var sortedSegments = request.Dto.Segments.OrderBy(s => s.PositionIndex).ToList();

                for (int i = 0; i < sortedSegments.Count; i++)
                {
                    var segmentDto = sortedSegments[i];

                    SegmentType segmentType;
                    if (!Enum.TryParse<SegmentType>(segmentDto.SegmentData.Type, out segmentType))
                    {
                        segmentType = SegmentType.Text;
                    }

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

                var createdSegments = new List<SongSegment>();

                foreach (var segmentData in segmentDataList)
                {
                    var contentHash = SongSegment.CalculateContentHash(
                        segmentData.Lyric,
                        segmentData.ChordId,
                        segmentData.PatternId);

                    var existingSegment = await _unitOfWork.SongSegments.GetQueryable()
                        .FirstOrDefaultAsync(s => s.ContentHash == contentHash, cancellationToken);

                    if (existingSegment == null)
                    {
                        var segment = SongSegment.Create(
                            segmentData.Type,
                            segmentData.Lyric,
                            segmentData.ChordId,
                            segmentData.PatternId,
                            segmentData.Duration,
                            segmentData.Description,
                            segmentData.Color,
                            segmentData.BackgroundColor);

                        await _unitOfWork.SongSegments.AddAsync(segment, cancellationToken);
                        createdSegments.Add(segment);
                    }
                    else
                    {
                        createdSegments.Add(existingSegment);
                    }
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);

                var positionIndex = 0;
                foreach (var segment in createdSegments)
                {
                    string? repeatGroup = null;
                    if (repeatGroups.ContainsKey(positionIndex))
                    {
                        repeatGroup = repeatGroups[positionIndex];
                    }

                    var position = SongSegmentPosition.Create(
                        song.Id, 
                        
                        segment.Id,
                        positionIndex,
                        repeatGroup);

                    await _unitOfWork.SongSegmentPositions.AddAsync(position, cancellationToken);
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
                    var songChord = SongChord.Create(song.Id, chordId);
                    await _unitOfWork.SongChords.AddAsync(songChord, cancellationToken);
                }

                var uniquePatternIds = segmentDataList
                    .Where(sd => sd.PatternId.HasValue)
                    .Select(sd => sd.PatternId!.Value)
                    .Distinct()
                    .ToList();

                foreach (var patternId in uniquePatternIds)
                {
                    var songPattern = SongPattern.Create(song.Id, patternId);
                    await _unitOfWork.SongPatterns.AddAsync(songPattern, cancellationToken);
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);

                if (request.Dto.SegmentComments != null && request.Dto.SegmentComments.Any())
                {
                    foreach (var commentGroup in request.Dto.SegmentComments)
                    {
                        var segmentIndex = commentGroup.Key;
                        if (segmentIndex >= 0 && segmentIndex < createdSegments.Count)
                        {
                            var segmentId = createdSegments[segmentIndex].Id;

                            foreach (var commentDto in commentGroup.Value)
                            {
                                var comment = SongComment.Create(
                                    song.Id,
                                    commentDto.Text,
                                    segmentId);

                                await _unitOfWork.SongComments.AddAsync(comment, cancellationToken);
                            }
                        }
                    }

                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                }
            }

            await UpdateFullTextAsync(song.Id, cancellationToken); 

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
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating song with segments: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            throw;
        }
    }

    private async Task UpdateFullTextAsync(Guid songId, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetQueryable()
            .Include(s => s.Structure)
                .ThenInclude(st => st.SegmentPositions)
                    .ThenInclude(sp => sp.Segment)
            .FirstOrDefaultAsync(s => s.Id == songId, cancellationToken);

        if (song == null) return;

        var fullTextBuilder = new System.Text.StringBuilder();

        if (!string.IsNullOrEmpty(song.Artist))
        {
            fullTextBuilder.Append(song.Artist).Append(' ');
        }

        fullTextBuilder.Append(song.Title).Append(' ');

        if (!string.IsNullOrEmpty(song.Description))
        {
            fullTextBuilder.Append(song.Description).Append(' ');
        }

        if (song.Structure?.SegmentPositions != null)
        {
            var segmentLyrics = song.Structure.SegmentPositions
                .OrderBy(sp => sp.PositionIndex)
                .Select(sp => sp.Segment?.Lyric)
                .Where(lyric => !string.IsNullOrEmpty(lyric))
                .ToList();

            foreach (var lyric in segmentLyrics)
            {
                fullTextBuilder.Append(lyric).Append(' ');
            }
        }

        song.SetFullText(fullTextBuilder.ToString().Trim());
        song.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}