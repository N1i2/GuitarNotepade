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
    private readonly IWebDavService _webDavService;

    public CreateSongWithSegmentsCommandHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IWebDavService webDavService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _webDavService = webDavService;
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

            string? audioUrl = null;
            string? audioType = null;

            if (!string.IsNullOrEmpty(request.Dto.CustomAudioUrl) && !string.IsNullOrEmpty(request.Dto.CustomAudioType))
            {
                if (request.Dto.CustomAudioType == Constants.AudioTypes.UrlType)
                {
                    audioUrl = request.Dto.CustomAudioUrl;
                    audioType = Constants.AudioTypes.UrlType;
                    Console.WriteLine($"Using audio URL: {audioUrl}");
                }
                else if (request.Dto.CustomAudioType == Constants.AudioTypes.FileType)
                {
                    if (request.Dto.CustomAudioUrl.StartsWith("data:audio/"))
                    {
                        try
                        {
                            var fileExtension = GetAudioFileExtensionFromBase64(request.Dto.CustomAudioUrl);
                            var fileName = $"audio_{Guid.NewGuid():N}{fileExtension}";

                            var cleanBase64 = CleanBase64String(request.Dto.CustomAudioUrl);

                            var audioBytes = Convert.FromBase64String(cleanBase64);
                            using var stream = new MemoryStream(audioBytes);

                            audioUrl = await _webDavService.UploadAudioAsync(stream, fileName, request.UserId);
                            audioType = Constants.AudioTypes.FileType;

                            Console.WriteLine($"Audio uploaded to Yandex.Disk: {audioUrl}");
                        }
                        catch (FormatException ex)
                        {
                            Console.WriteLine($"Invalid base64 format: {ex.Message}");
                            throw new Exception("Invalid audio format");
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error uploading audio: {ex.Message}");
                            throw new Exception($"Error uploading audio: {ex.Message}");
                        }
                    }
                    else
                    {
                        audioUrl = request.Dto.CustomAudioUrl;
                        audioType = Constants.AudioTypes.FileType;
                    }
                }
            }

            var song = Song.Create(
                ownerId: request.UserId,
                title: request.Dto.Title,
                isPublic: request.Dto.IsPublic,
                genre: request.Dto.Genre,
                theme: request.Dto.Theme,
                artist: request.Dto.Artist,
                description: request.Dto.Description,
                customAudioUrl: audioUrl,
                customAudioType: audioType,
                parentSongId: request.Dto.ParentSongId);

            await _unitOfWork.Songs.AddAsync(song, cancellationToken);
            await _unitOfWork.SongStructures.AddAsync(song.Structure, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            if (request.Dto.Segments != null && request.Dto.Segments.Any())
            {
                await ProcessSegmentsAsync(song, request.Dto.Segments, cancellationToken);
            }

            if (request.Dto.SegmentComments != null && request.Dto.SegmentComments.Any())
            {
                await ProcessSegmentCommentsAsync(request.UserId, song, request.Dto.Segments!, request.Dto.SegmentComments, cancellationToken);
            }

            await UpdateFullTextAsync(song.Id, cancellationToken);

            var fullSong = await GetFullSongWithIncludesAsync(song.Id, cancellationToken);

            return _mapper.Map<SongDto>(fullSong);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating song with segments: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            throw;
        }
    }

    private async Task ProcessSegmentsAsync(Song song, List<SegmentDataWithPositionDto> segmentsDto, CancellationToken cancellationToken)
    {
        var segmentDataList = new List<SongStructure.SegmentData>();
        var repeatGroups = new Dictionary<int, string>();

        var sortedSegments = segmentsDto.OrderBy(s => s.PositionIndex).ToList();

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

    private async Task ProcessSegmentCommentsAsync(
        Guid userId,
        Song song,
        List<SegmentDataWithPositionDto> segments,
        Dictionary<int, List<CreateSongCommentDto>> segmentComments,
        CancellationToken cancellationToken)
    {
        var segmentPositions = await _unitOfWork.SongSegmentPositions.GetQueryable()
            .Where(sp => sp.SongId == song.Id)
            .OrderBy(sp => sp.PositionIndex)
            .ToListAsync(cancellationToken);

        foreach (var commentGroup in segmentComments)
        {
            var segmentIndex = commentGroup.Key;

            if (segmentIndex >= 0 && segmentIndex < segmentPositions.Count)
            {
                var segmentId = segmentPositions[segmentIndex].SegmentId;

                foreach (var commentDto in commentGroup.Value)
                {
                    var comment = SongComment.Create(
                        userId: userId,
                        songId: song.Id,
                        text: commentDto.Text,
                        segmentId: segmentId);

                    await _unitOfWork.SongComments.AddAsync(comment, cancellationToken);
                }
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