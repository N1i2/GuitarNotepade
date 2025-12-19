using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class SongLabelService : ISongLabelService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<SongLabelService> _logger;

    public SongLabelService(IUnitOfWork unitOfWork, ILogger<SongLabelService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<SongLabel> CreateLabelAsync(
        string name,
        string? color = null,
        CancellationToken cancellationToken = default)
    {
        var existingLabel = await _unitOfWork.SongLabels.GetByNameAsync(name, cancellationToken);
        if (existingLabel != null)
            throw new InvalidOperationException($"Label with name '{name}' already exists");

        var label = SongLabel.Create(name, color);
        label = await _unitOfWork.SongLabels.CreateAsync(label, cancellationToken);

        _logger.LogInformation("Label created: {LabelId} with name '{Name}'", label.Id, name);
        return label;
    }

    public async Task<SongLabel> UpdateLabelAsync(
        Guid labelId,
        string? name = null,
        string? color = null,
        CancellationToken cancellationToken = default)
    {
        var label = await _unitOfWork.SongLabels.GetByIdAsync(labelId, cancellationToken);
        if (label == null)
            throw new ArgumentException("Label not found", nameof(labelId));

        if (name != null && name != label.Name)
        {
            var existingLabel = await _unitOfWork.SongLabels.GetByNameAsync(name, cancellationToken);
            if (existingLabel != null)
                throw new InvalidOperationException($"Label with name '{name}' already exists");
        }

        label.Update(name, color);
        label = await _unitOfWork.SongLabels.UpdateAsync(label, cancellationToken);

        _logger.LogInformation("Label updated: {LabelId}", labelId);
        return label!;
    }

    public async Task DeleteLabelAsync(
        Guid labelId,
        CancellationToken cancellationToken = default)
    {
        var label = await _unitOfWork.SongLabels.GetByIdAsync(labelId, cancellationToken);
        if (label == null)
            throw new ArgumentException("Label not found", nameof(labelId));

        await _unitOfWork.SongLabels.DeleteAsync(labelId, cancellationToken);

        _logger.LogInformation("Label deleted: {LabelId}", labelId);
    }

    public async Task<List<SongLabel>> GetAllLabelsAsync(
        CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.SongLabels.GetAllAsync(cancellationToken);
    }

    public async Task<List<SongLabel>> SearchLabelsAsync(
        string searchTerm,
        CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.SongLabels.SearchByNameAsync(searchTerm, cancellationToken);
    }

    public async Task<bool> LabelExistsAsync(
        string name,
        CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.SongLabels.ExistsByNameAsync(name, cancellationToken);
    }

    public async Task<List<SongSegment>> GetSegmentsWithLabelAsync(
        Guid labelId,
        CancellationToken cancellationToken = default)
    {
        var label = await _unitOfWork.SongLabels.GetByIdAsync(labelId, cancellationToken);
        if (label == null)
            throw new ArgumentException("Label not found", nameof(labelId));

        var segmentLabels = await _unitOfWork.SegmentLabels.GetByLabelIdAsync(labelId, cancellationToken);
        return segmentLabels.Select(sl => sl.Segment).ToList();
    }
}