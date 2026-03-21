using Application.DTOs.Song;
using AutoMapper;
using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class BuildSongStructureCommandHandler : IRequestHandler<BuildSongStructureCommand, SongStructureDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISongService _songService;
    private readonly ISongSegmentService _segmentService;
    private readonly IMapper _mapper;
    private readonly ILogger<BuildSongStructureCommandHandler> _logger;

    public BuildSongStructureCommandHandler(
        IUnitOfWork unitOfWork,
        ISongService songService,
        ISongSegmentService segmentService,
        IMapper mapper,
        ILogger<BuildSongStructureCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _songService = songService;
        _segmentService = segmentService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<SongStructureDto> Handle(BuildSongStructureCommand request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);

        if (song == null)
        {
            throw new KeyNotFoundException($"Song with id {request.SongId} not found");
        }

        if (song.OwnerId != request.UserId)
        {
            throw new UnauthorizedAccessException("Only song owner can modify song structure");
        }

        var segmentDataList = request.Segments.Select(s => new SongStructure.SegmentData(
            Type: Enum.Parse<SegmentType>(s.Type),
            Lyric: s.Lyric,
            ChordId: s.ChordId,
            PatternId: s.PatternId,
            Duration: s.Duration,
            Description: s.Description,
            Color: s.Color,
            BackgroundColor: s.BackgroundColor
        )).ToList();

        if (segmentDataList.Count > Constants.Limits.MaxSegmentPositionsPerSong)
        {
            throw new InvalidOperationException($"Cannot create more than {Constants.Limits.MaxSegmentPositionsPerSong} segments per song");
        }

        var existingStructure = await _unitOfWork.SongStructures
            .GetWithSegmentsAsync(request.SongId, cancellationToken);

        if (existingStructure != null && existingStructure.SegmentPositions != null)
        {
            var newSegmentHashes = segmentDataList.Select(sd =>
                SongSegment.CalculateContentHash(sd.Lyric, sd.ChordId, sd.PatternId)).ToHashSet();

            var oldSegments = existingStructure.SegmentPositions
                .Select(sp => sp.Segment)
                .Distinct()
                .Where(s => !newSegmentHashes.Contains(s.ContentHash))
                .ToList();

            foreach (var segment in oldSegments)
            {
                var comments = await _unitOfWork.SongComments
                    .GetBySegmentIdAsync(segment.Id, cancellationToken);

                foreach (var comment in comments)
                {
                    await _unitOfWork.SongComments.DeleteAsync(comment.Id, cancellationToken);
                }
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var structure = await _songService.BuildSongStructureAsync(
            songId: request.SongId,
            segmentDataList: segmentDataList,
            repeatGroups: request.RepeatGroups,
            cancellationToken: cancellationToken);

        if (request.SegmentComments != null && request.SegmentComments.Any())
        {
            _logger.LogInformation("Processing comments for song {SongId}", request.SongId);

            var structureWithSegments = await _unitOfWork.SongStructures
                .GetWithSegmentsAsync(request.SongId, cancellationToken);

            if (structureWithSegments != null)
            {
                var existingComments = await _unitOfWork.SongComments
                    .GetBySongIdAsync(request.SongId, 1, int.MaxValue, cancellationToken);

                var existingCommentsBySegment = existingComments
                    .Where(c => c.SegmentId.HasValue)
                    .ToDictionary(c => c.SegmentId!.Value, c => c);

                var activeSegmentIds = new HashSet<Guid>();

                foreach (var commentEntry in request.SegmentComments)
                {
                    int positionIndex = commentEntry.Key;
                    var comments = commentEntry.Value;

                    var position = structureWithSegments.SegmentPositions?
                        .FirstOrDefault(p => p.PositionIndex == positionIndex);

                    if (position != null)
                    {
                        activeSegmentIds.Add(position.SegmentId);

                        if (comments != null && comments.Any() && !string.IsNullOrWhiteSpace(comments[0].Text))
                        {
                            if (existingCommentsBySegment.TryGetValue(position.SegmentId, out var existingComment))
                            {
                                existingComment.Update(comments[0].Text);
                                await _unitOfWork.SongComments.UpdateAsync(existingComment, cancellationToken);
                                _logger.LogDebug("Updated comment for segment {SegmentId}", position.SegmentId);
                            }
                            else
                            {
                                var newComment = SongComment.Create(
                                    userId: request.UserId,
                                    songId: request.SongId,
                                    text: comments[0].Text,
                                    segmentId: position.SegmentId);
                                await _unitOfWork.SongComments.CreateAsync(newComment, cancellationToken);
                                _logger.LogDebug("Created comment for segment {SegmentId}", position.SegmentId);
                            }
                        }
                    }
                }

                foreach (var existingComment in existingCommentsBySegment.Values)
                {
                    if (!activeSegmentIds.Contains(existingComment.SegmentId!.Value))
                    {
                        await _unitOfWork.SongComments.DeleteAsync(existingComment.Id, cancellationToken);
                        _logger.LogDebug("Deleted comment for segment {SegmentId}", existingComment.SegmentId);
                    }
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Comments processed successfully for song {SongId}", request.SongId);
            }
        }

        await _songService.UpdateSongStatisticsAsync(request.SongId, cancellationToken);

        _logger.LogInformation(
            "Song structure built for song {SongId} with {SegmentCount} segments by user {UserId}",
            request.SongId,
            segmentDataList.Count,
            request.UserId);

        var structureDto = _mapper.Map<SongStructureDto>(structure);

        if (request.RepeatGroups != null && request.RepeatGroups.Any())
        {
            structureDto.RepeatGroups = ConvertRepeatGroups(request.RepeatGroups);
        }

        return structureDto;
    }

    private Dictionary<string, List<int>> ConvertRepeatGroups(Dictionary<int, string> repeatGroups)
    {
        var result = new Dictionary<string, List<int>>();

        foreach (var kvp in repeatGroups)
        {
            int position = kvp.Key;
            string groupName = kvp.Value;

            if (!result.ContainsKey(groupName))
            {
                result[groupName] = new List<int>();
            }

            result[groupName].Add(position);
        }

        foreach (var groupName in result.Keys.ToList())
        {
            result[groupName].Sort();
        }

        return result;
    }
}