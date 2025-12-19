using Domain.Entities;

namespace Domain.Interfaces.Services;

public interface ISongLabelService
{
    Task<SongLabel> CreateLabelAsync(
        string name,
        string? color = null,
        CancellationToken cancellationToken = default);

    Task<SongLabel> UpdateLabelAsync(
        Guid labelId,
        string? name = null,
        string? color = null,
        CancellationToken cancellationToken = default);

    Task DeleteLabelAsync(
        Guid labelId,
        CancellationToken cancellationToken = default);

    Task<List<SongLabel>> GetAllLabelsAsync(
        CancellationToken cancellationToken = default);

    Task<List<SongLabel>> SearchLabelsAsync(
        string searchTerm,
        CancellationToken cancellationToken = default);

    Task<bool> LabelExistsAsync(
        string name,
        CancellationToken cancellationToken = default);

    Task<List<SongSegment>> GetSegmentsWithLabelAsync(
        Guid labelId,
        CancellationToken cancellationToken = default);
}