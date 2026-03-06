using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class SongSegmentService : ISongSegmentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<SongSegmentService> _logger;

    public SongSegmentService(IUnitOfWork unitOfWork, ILogger<SongSegmentService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<SongSegment> CreateSegmentAsync(
        SegmentType type,
        string? lyric = null,
        Guid? chordId = null,
        Guid? patternId = null,
        int? duration = null,
        string? description = null,
        string? color = null,
        string? backgroundColor = null,
        CancellationToken cancellationToken = default)
    {
        if (chordId.HasValue)
        {
            var chord = await _unitOfWork.Chords.GetByIdAsync(chordId.Value, cancellationToken);
            if (chord == null)
                throw new ArgumentException($"Chord with id {chordId} not found", nameof(chordId));
        }

        if (patternId.HasValue)
        {
            var pattern = await _unitOfWork.StrummingPatterns.GetByIdAsync(patternId.Value, cancellationToken);
            if (pattern == null)
                throw new ArgumentException($"Pattern with id {patternId} not found", nameof(patternId));
        }

        var segment = SongSegment.Create(
            type,
            lyric,
            chordId,
            patternId,
            duration,
            description,
            color,
            backgroundColor);

        segment = await _unitOfWork.SongSegments.CreateAsync(segment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Segment created: {SegmentId} | Type: {Type} | Hash: {Hash}",
            segment.Id,
            type,
            segment.ContentHash);

        return segment;
    }

    public async Task<SongSegment> UpdateSegmentAsync(
        Guid segmentId,
        string? lyric = null,
        Guid? chordId = null,
        Guid? patternId = null,
        int? duration = null,
        string? description = null,
        string? color = null,
        string? backgroundColor = null,
        CancellationToken cancellationToken = default)
    {
        var segment = await _unitOfWork.SongSegments.GetByIdAsync(segmentId, cancellationToken);
        if (segment == null)
            throw new ArgumentException($"Segment with id {segmentId} not found", nameof(segmentId));

        var positions = await _unitOfWork.SongSegmentPositions
            .GetBySegmentIdAsync(segmentId, cancellationToken);

        var isShared = positions.Count > 1;

        if (isShared)
        {
            _logger.LogWarning(
                "Updating SHARED segment {SegmentId} used in {Count} positions. " +
                "This will affect ALL occurrences!",
                segmentId,
                positions.Count);
        }

        if (chordId.HasValue)
        {
            var chord = await _unitOfWork.Chords.GetByIdAsync(chordId.Value, cancellationToken);
            if (chord == null)
                throw new ArgumentException($"Chord with id {chordId} not found", nameof(chordId));
        }

        if (patternId.HasValue)
        {
            var pattern = await _unitOfWork.StrummingPatterns.GetByIdAsync(patternId.Value, cancellationToken);
            if (pattern == null)
                throw new ArgumentException($"Pattern with id {patternId} not found", nameof(patternId));
        }

        segment.Update(lyric, chordId, patternId, duration, description, color, backgroundColor);
        segment = await _unitOfWork.SongSegments.UpdateAsync(segment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Segment updated: {SegmentId} | New hash: {Hash} | Shared: {IsShared}",
            segmentId,
            segment!.ContentHash,
            isShared);

        return segment!;
    }

    public async Task ReplaceSegmentAtPositionAsync(
        Guid songId,
        int positionIndex,
        Guid userId,
        SegmentType type,
        string? lyric = null,
        Guid? chordId = null,
        Guid? patternId = null,
        int? duration = null,
        string? description = null,
        string? color = null,
        string? backgroundColor = null,
        CancellationToken cancellationToken = default)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);
        if (song == null)
            throw new ArgumentException("Song not found", nameof(songId));

        if (song.OwnerId != userId)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
            if (user?.Role != Constants.Roles.Admin)
            {
                throw new UnauthorizedAccessException("Only song owner can modify song structure");
            }
        }

        var structure = await _unitOfWork.SongStructures
            .GetWithSegmentsAsync(songId, cancellationToken);

        if (structure == null)
        {
            throw new ArgumentException($"Song structure not found for song {songId}");
        }

        var position = structure.SegmentPositions
            .FirstOrDefault(p => p.PositionIndex == positionIndex);

        if (position == null)
            throw new ArgumentException($"No segment at position {positionIndex}");

        var oldSegmentId = position.SegmentId;

        var newSegment = await GetOrCreateSegmentForSongAsync(
            songId: songId,
            type: type,
            lyric: lyric,
            chordId: chordId,
            patternId: patternId,
            duration: duration,
            description: description,
            color: color,
            backgroundColor: backgroundColor,
            cancellationToken: cancellationToken);

        if (newSegment.Id == oldSegmentId)
        {
            _logger.LogDebug(
                "Segment at position {Position} already has the same content",
                positionIndex);
            return;
        }

        structure.ReplaceSegmentAtPosition(positionIndex, newSegment.Id);
        await _unitOfWork.SongStructures.UpdateAsync(structure, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "User {UserId} replaced segment at position {Position} | Old: {OldSegmentId} | New: {NewSegmentId}",
            userId,
            positionIndex,
            oldSegmentId,
            newSegment.Id);
    }

    public async Task<SongSegment> GetOrCreateSegmentForSongAsync(
        Guid songId,
        SegmentType type,
        string? lyric = null,
        Guid? chordId = null,
        Guid? patternId = null,
        int? duration = null,
        string? description = null,
        string? color = null,
        string? backgroundColor = null,
        CancellationToken cancellationToken = default)
    {
        var hash = SongSegment.CalculateContentHash(lyric, chordId, patternId);

        _logger.LogDebug(
            "Looking for segment with hash {Hash} in song {SongId}",
            hash,
            songId);

        var songSegments = await _unitOfWork.SongSegments
            .GetBySongIdAsync(songId, cancellationToken);

        var existingSegment = songSegments.FirstOrDefault(s => s.ContentHash == hash);
        if (existingSegment != null)
        {
            _logger.LogDebug(
                "Found existing segment {SegmentId} in song {SongId} with hash {Hash}",
                existingSegment.Id,
                songId,
                hash);

            return existingSegment;
        }

        var newSegment = await CreateSegmentAsync(
            type: type,
            lyric: lyric,
            chordId: chordId,
            patternId: patternId,
            duration: duration,
            description: description,
            color: color,
            backgroundColor: backgroundColor,
            cancellationToken: cancellationToken);

        _logger.LogInformation(
            "Created new segment {SegmentId} for song {SongId} with hash {Hash}",
            newSegment.Id,
            songId,
            hash);

        return newSegment;
    }

    public async Task<List<SongSegment>> GetSegmentsForSongAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        var segments = await _unitOfWork.SongSegments.GetBySongIdAsync(songId, cancellationToken);

        _logger.LogDebug(
            "Retrieved {Count} segments for song {SongId}",
            segments.Count,
            songId);

        return segments;
    }

    public async Task<Dictionary<string, List<SongSegment>>> GetSegmentsGroupedByRepeatAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        var structure = await _unitOfWork.SongStructures.GetBySongIdAsync(songId, cancellationToken);
        if (structure == null)
        {
            _logger.LogDebug("No structure found for song {SongId}", songId);
            return new Dictionary<string, List<SongSegment>>();
        }

        var structureWithSegments = await _unitOfWork.SongStructures
            .GetWithSegmentsAsync(songId, cancellationToken);

        if (structureWithSegments == null)
            return new Dictionary<string, List<SongSegment>>();

        var groupedSegments = structureWithSegments.GetSegmentsGroupedByRepeat();

        _logger.LogDebug(
            "Found {GroupCount} repeat groups for song {SongId}",
            groupedSegments.Count,
            songId);

        return groupedSegments;
    }
}
