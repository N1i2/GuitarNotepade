using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface ISegmentLabelRepository : IBaseRepository<SegmentLabel>
{
    Task<SegmentLabel?> GetBySegmentAndLabelAsync(
        Guid segmentId,
        Guid labelId,
        CancellationToken cancellationToken = default);

    Task<List<SegmentLabel>> GetBySegmentIdAsync(
        Guid segmentId,
        CancellationToken cancellationToken = default);

    Task<List<SegmentLabel>> GetByLabelIdAsync(
        Guid labelId,
        CancellationToken cancellationToken = default);

    Task<List<SegmentLabel>> GetBySongIdAsync(
        Guid songId,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(
        Guid segmentId,
        Guid labelId,
        CancellationToken cancellationToken = default);

    Task<int> CountByLabelIdAsync(
        Guid labelId,
        CancellationToken cancellationToken = default);

    Task DeleteBySegmentAndLabelAsync(
        Guid segmentId,
        Guid labelId,
        CancellationToken cancellationToken = default);
}