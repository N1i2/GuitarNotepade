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
                throw new ArgumentException("Chord not found", nameof(chordId));
        }

        if (patternId.HasValue)
        {
            var pattern = await _unitOfWork.StrummingPatterns.GetByIdAsync(patternId.Value, cancellationToken);
            if (pattern == null)
                throw new ArgumentException("Pattern not found", nameof(patternId));
        }

        var segment = SongSegment.Create(type, lyric, chordId, patternId, duration, description, color, backgroundColor);
        segment = await _unitOfWork.SongSegments.CreateAsync(segment, cancellationToken);

        _logger.LogInformation("Segment created: {SegmentId} of type {Type}", segment.Id, type);
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
            throw new ArgumentException("Segment not found", nameof(segmentId));

        if (chordId.HasValue)
        {
            var chord = await _unitOfWork.Chords.GetByIdAsync(chordId.Value, cancellationToken);
            if (chord == null)
                throw new ArgumentException("Chord not found", nameof(chordId));
        }

        if (patternId.HasValue)
        {
            var pattern = await _unitOfWork.StrummingPatterns.GetByIdAsync(patternId.Value, cancellationToken);
            if (pattern == null)
                throw new ArgumentException("Pattern not found", nameof(patternId));
        }

        segment.Update(lyric, chordId, patternId, duration, description, color, backgroundColor);
        segment = await _unitOfWork.SongSegments.UpdateAsync(segment, cancellationToken);

        _logger.LogInformation("Segment updated: {SegmentId}", segmentId);
        return segment!;
    }

    public async Task<SongSegment> GetOrCreateSegmentAsync(
        List<SongSegment> existingSegments,
        SongStructure.SegmentData segmentData,
        CancellationToken cancellationToken = default)
    {
        var segmentManager = new SongSegmentManager(existingSegments);
        var segment = segmentManager.GetOrCreateSegment(segmentData);

        if (segment.Id == Guid.Empty)
        {
            segment = await _unitOfWork.SongSegments.CreateAsync(segment, cancellationToken);
        }

        return segment;
    }

    public async Task AddLabelToSegmentAsync(
        Guid segmentId,
        Guid labelId,
        CancellationToken cancellationToken = default)
    {
        var segment = await _unitOfWork.SongSegments.GetByIdAsync(segmentId, cancellationToken);
        if (segment == null)
            throw new ArgumentException("Segment not found", nameof(segmentId));

        var label = await _unitOfWork.SongLabels.GetByIdAsync(labelId, cancellationToken);
        if (label == null)
            throw new ArgumentException("Label not found", nameof(labelId));

        if (!segment.CanAddLabel())
            throw new InvalidOperationException("Maximum number of labels reached for this segment");

        var existingLabel = await _unitOfWork.SegmentLabels.GetBySegmentAndLabelAsync(segmentId, labelId, cancellationToken);
        if (existingLabel != null)
            throw new InvalidOperationException("Label already added to this segment");

        var segmentLabel = SegmentLabel.Create(segmentId, labelId);
        await _unitOfWork.SegmentLabels.CreateAsync(segmentLabel, cancellationToken);

        _logger.LogInformation("Label {LabelId} added to segment {SegmentId}", labelId, segmentId);
    }

    public async Task RemoveLabelFromSegmentAsync(
        Guid segmentId,
        Guid labelId,
        CancellationToken cancellationToken = default)
    {
        var segmentLabel = await _unitOfWork.SegmentLabels.GetBySegmentAndLabelAsync(segmentId, labelId, cancellationToken);
        if (segmentLabel == null)
            throw new ArgumentException("Label not found on this segment");

        await _unitOfWork.SegmentLabels.DeleteAsync(segmentLabel.Id, cancellationToken);

        _logger.LogInformation("Label {LabelId} removed from segment {SegmentId}", labelId, segmentId);
    }

    public async Task<List<SongSegment>> GetSegmentsForSongAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.SongSegments.GetBySongIdAsync(songId, cancellationToken);
    }

    public async Task<Dictionary<string, List<SongSegment>>> GetSegmentsGroupedByRepeatAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        var structure = await _unitOfWork.SongStructures.GetBySongIdAsync(songId, cancellationToken);
        if (structure == null)
            return new Dictionary<string, List<SongSegment>>();

        var segmentPositions = await _unitOfWork.SongSegmentPositions.GetBySongIdOrderedAsync(songId, cancellationToken);

        return segmentPositions
            .Where(sp => !string.IsNullOrEmpty(sp.RepeatGroup))
            .GroupBy(sp => sp.RepeatGroup!)
            .ToDictionary(g => g.Key, g => g.Select(sp => sp.Segment).ToList());
    }
}