using Application.DTOs.Song;
using AutoMapper;
using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Songs;

public class UpdateSongCommandHandler : IRequestHandler<UpdateSongCommand, SongDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IWebDavService _webDavService;
    private readonly ILogger<UpdateSongCommandHandler> _logger;

    public UpdateSongCommandHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IWebDavService webDavService,
        ILogger<UpdateSongCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _webDavService = webDavService;
        _logger = logger;
    }

    public async Task<SongDto> Handle(UpdateSongCommand request, CancellationToken cancellationToken)
    {
        return await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            var song = await _unitOfWork.Songs.GetQueryable()
                .Include(s => s.Structure)
                .Include(s => s.SongChords)
                .Include(s => s.SongPatterns)
                .Include(s => s.Comments)
                .Include(s => s.Reviews)
                .Include(s => s.SegmentPositions)
                .FirstOrDefaultAsync(s => s.Id == request.Dto.Id, cancellationToken);

            if (song == null)
            {
                throw new ArgumentException($"Song not found with id: {request.Dto.Id}", nameof(request.Dto.Id));
            }

            if (song.OwnerId != request.UserId)
            {
                throw new UnauthorizedAccessException("You can only update your own songs");
            }

            if (request.Dto.ParentSongId.HasValue && request.Dto.ParentSongId.Value != song.ParentSongId)
            {
                if (request.Dto.ParentSongId.Value == song.Id)
                {
                    throw new ArgumentException("Song cannot be its own parent", nameof(request.Dto.ParentSongId));
                }

                var parentSong = await _unitOfWork.Songs.GetByIdAsync(request.Dto.ParentSongId.Value, cancellationToken);
                if (parentSong == null || !parentSong.IsPublic)
                {
                    throw new ArgumentException("Parent song not found or not public", nameof(request.Dto.ParentSongId));
                }

                song.SetParent(request.Dto.ParentSongId.Value);
            }
            else if (request.Dto.ParentSongId == null && song.ParentSongId.HasValue)
            {
                song.SetParent(null);
            }

            song.Update(
                title: request.Dto.Title,
                artist: request.Dto.Artist,
                genre: request.Dto.Genre,
                theme: request.Dto.Theme,
                description: request.Dto.Description,
                customAudioUrl: request.Dto.CustomAudioUrl,
                customAudioType: request.Dto.CustomAudioType,
                isPublic: request.Dto.IsPublic
            );

            await ProcessAudioForBase64FileAsync(song, request.Dto, request.UserId, cancellationToken);

            if (request.Dto.Segments != null)
            {
                await UpdateSegmentsAsync(song, request.Dto.Segments, cancellationToken);
            }

            if (request.Dto.SegmentComments != null)
            {
                await UpdateSegmentCommentsAsync(request.UserId, song, request.Dto.SegmentComments, cancellationToken);
            }

            await UpdateFullTextAsync(song.Id, cancellationToken);

            var fullSong = await GetFullSongWithIncludesAsync(song.Id, cancellationToken);

            _logger.LogInformation("Song updated successfully. SongId: {SongId}, UserId: {UserId}",
                song.Id, request.UserId);

            return _mapper.Map<SongDto>(fullSong);
        }, cancellationToken);
    }

    private async Task ProcessAudioForBase64FileAsync(
        Song song,
        UpdateSongWithSegmentsDto dto,
        Guid userId,
        CancellationToken cancellationToken)
    {
        if (dto.CustomAudioUrl == string.Empty && dto.CustomAudioType == string.Empty)
        {
            await DeleteOldAudioIfNeeded(song);
            return;
        }

        if (!string.IsNullOrEmpty(dto.CustomAudioUrl) &&
            !string.IsNullOrEmpty(dto.CustomAudioType) &&
            dto.CustomAudioUrl.StartsWith("data:audio/") &&
            dto.CustomAudioType == Constants.AudioTypes.FileType)
        {
            try
            {
                await DeleteOldAudioIfNeeded(song);

                var fileExtension = GetAudioFileExtensionFromBase64(dto.CustomAudioUrl);
                var uniqueFileName = $"{song.Id}_{Guid.NewGuid():N}{fileExtension}";

                var cleanBase64 = CleanBase64String(dto.CustomAudioUrl);
                var audioBytes = Convert.FromBase64String(cleanBase64);
                using var stream = new MemoryStream(audioBytes);

                var uploadedFileName = await _webDavService.UploadAudioAsync(stream, uniqueFileName, song.Id);

                song.Update(customAudioUrl: uploadedFileName, customAudioType: Constants.AudioTypes.FileType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading audio file. UserId: {UserId}, SongId: {SongId}",
                    userId, song.Id);
                throw new Exception($"Error uploading audio: {ex.Message}");
            }
        }
    }

    private async Task DeleteOldAudioIfNeeded(Song song)
    {
        if (!string.IsNullOrEmpty(song.CustomAudioUrl) &&
            song.CustomAudioType == Constants.AudioTypes.FileType &&
            !song.CustomAudioUrl.StartsWith("http") &&
            !string.IsNullOrEmpty(song.CustomAudioUrl))
        {
            try
            {
                await _webDavService.DeleteAudioAsync(song.CustomAudioUrl);
                _logger.LogInformation("Old audio file deleted. Path: {Path}", song.CustomAudioUrl);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error deleting old audio file. Path: {Path}", song.CustomAudioUrl);
            }
        }
    }

    private async Task UpdateSegmentsAsync(
        Song song,
        List<SegmentDataWithPositionDto> segmentsDto,
        CancellationToken cancellationToken)
    {
        if (segmentsDto.Count == 0)
        {
            await ClearAllSegmentsAsync(song, cancellationToken);
            return;
        }

        await ClearAllSegmentsAsync(song, cancellationToken);

        var segmentDataList = new List<SongStructure.SegmentData>();
        var repeatGroups = new Dictionary<int, string>();

        var sortedSegments = segmentsDto
            .OrderBy(s => s.PositionIndex)
            .ToList();

        var duplicatePositions = sortedSegments
            .GroupBy(s => s.PositionIndex)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();

        if (duplicatePositions.Any())
        {
            throw new ArgumentException($"Duplicate position indices found: {string.Join(", ", duplicatePositions)}");
        }

        for (int i = 0; i < sortedSegments.Count; i++)
        {
            if (sortedSegments[i].PositionIndex != i)
            {
                throw new ArgumentException($"Non-continuous position indices. Expected position {i}, got {sortedSegments[i].PositionIndex}");
            }
        }

        for (int i = 0; i < sortedSegments.Count; i++)
        {
            var segmentDto = sortedSegments[i];

            if (!Enum.TryParse<SegmentType>(segmentDto.SegmentData.Type, out var segmentType))
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

        for (int positionIndex = 0; positionIndex < createdSegments.Count; positionIndex++)
        {
            var segment = createdSegments[positionIndex];
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

            await _unitOfWork.SongSegmentPositions.AddAsync(position, cancellationToken);
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
    }

    private async Task ClearAllSegmentsAsync(Song song, CancellationToken cancellationToken)
    {
        foreach (var position in song.SegmentPositions.ToList())
        {
            song.SegmentPositions.Remove(position);
            await _unitOfWork.SongSegmentPositions.DeleteAsync(position.Id, cancellationToken);
        }

        foreach (var songChord in song.SongChords.ToList())
        {
            song.SongChords.Remove(songChord);
            await _unitOfWork.SongChords.DeleteAsync(songChord.Id, cancellationToken);
        }

        foreach (var songPattern in song.SongPatterns.ToList())
        {
            song.SongPatterns.Remove(songPattern);
            await _unitOfWork.SongPatterns.DeleteAsync(songPattern.Id, cancellationToken);
        }

        var segmentComments = song.Comments
            .Where(c => c.SegmentId.HasValue)
            .ToList();

        foreach (var comment in segmentComments)
        {
            song.Comments.Remove(comment);
            await _unitOfWork.SongComments.DeleteAsync(comment.Id, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task UpdateSegmentCommentsAsync(
        Guid userId,
        Song song,
        Dictionary<int, List<CreateSongCommentDto>> segmentComments,
        CancellationToken cancellationToken)
    {
        if (segmentComments.Count == 0)
        {
            return;
        }

        var segmentPositions = await _unitOfWork.SongSegmentPositions.GetQueryable()
            .Where(sp => sp.SongId == song.Id)
            .OrderBy(sp => sp.PositionIndex)
            .ToListAsync(cancellationToken);

        if (segmentPositions.Count == 0)
        {
            _logger.LogWarning("No segment positions found for song {SongId} when updating comments", song.Id);
            return;
        }

        var existingSegmentComments = await _unitOfWork.SongComments.GetQueryable()
            .Where(sc => sc.SongId == song.Id && sc.SegmentId.HasValue)
            .ToListAsync(cancellationToken);

        foreach (var comment in existingSegmentComments)
        {
            await _unitOfWork.SongComments.DeleteAsync(comment.Id, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        foreach (var commentGroup in segmentComments)
        {
            var segmentIndex = commentGroup.Key;

            if (segmentIndex < 0 || segmentIndex >= segmentPositions.Count)
            {
                _logger.LogWarning("Invalid segment index {Index} for song {SongId}. Total segments: {Total}",
                    segmentIndex, song.Id, segmentPositions.Count);
                continue;
            }

            var segmentId = segmentPositions[segmentIndex].SegmentId;

            foreach (var commentDto in commentGroup.Value)
            {
                if (string.IsNullOrWhiteSpace(commentDto.Text))
                {
                    _logger.LogWarning("Empty comment text for segment {SegmentId} in song {SongId}",
                        segmentId, song.Id);
                    continue;
                }

                var comment = SongComment.Create(
                    userId: userId,
                    songId: song.Id,
                    text: commentDto.Text.Trim(),
                    segmentId: segmentId);

                await _unitOfWork.SongComments.AddAsync(comment, cancellationToken);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task UpdateFullTextAsync(Guid songId, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetQueryable()
            .Include(s => s.Structure)
                .ThenInclude(st => st.SegmentPositions)
                    .ThenInclude(sp => sp.Segment)
            .FirstOrDefaultAsync(s => s.Id == songId, cancellationToken);

        if (song == null) return;

        song.UpdateFullText();
        await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<Song?> GetFullSongWithIncludesAsync(Guid songId, CancellationToken cancellationToken)
    {
        return await _unitOfWork.Songs.GetQueryable()
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
                .ThenInclude(c => c.User)
            .Include(s => s.Reviews)
            .FirstOrDefaultAsync(s => s.Id == songId, cancellationToken);
    }

    private string CleanBase64String(string base64)
    {
        if (base64.Contains("data:") && base64.Contains("base64,"))
        {
            var parts = base64.Split(',');
            if (parts.Length == 2)
            {
                return parts[1];
            }
        }
        return base64;
    }

    private string GetAudioFileExtensionFromBase64(string base64)
    {
        if (base64.StartsWith("data:audio/mpeg;base64,") ||
            base64.StartsWith("data:audio/mp3;base64,") ||
            base64.StartsWith("data:audio/mpga;base64,"))
        {
            return ".mp3";
        }
        else if (base64.StartsWith("data:audio/wav;base64,") ||
                 base64.StartsWith("data:audio/x-wav;base64,") ||
                 base64.StartsWith("data:audio/vnd.wave;base64,"))
        {
            return ".wav";
        }
        else if (base64.StartsWith("data:audio/ogg;base64,"))
        {
            return ".ogg";
        }
        else if (base64.StartsWith("data:audio/mp4;base64,") ||
                 base64.StartsWith("data:audio/m4a;base64,") ||
                 base64.StartsWith("data:audio/x-m4a;base64,"))
        {
            return ".m4a";
        }
        else if (base64.StartsWith("data:audio/aac;base64,"))
        {
            return ".aac";
        }
        else if (base64.StartsWith("data:audio/flac;base64,") ||
                 base64.StartsWith("data:audio/x-flac;base64,"))
        {
            return ".flac";
        }
        else if (base64.StartsWith("data:audio/opus;base64,"))
        {
            return ".opus";
        }
        else if (base64.StartsWith("data:audio/webm;base64,"))
        {
            return ".webm";
        }
        else
        {
            return ".mp3";
        }
    }
}