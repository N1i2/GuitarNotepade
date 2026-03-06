using Domain.Common;
using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface ISongSegmentRepository : IBaseRepository<SongSegment>
{
    /// <summary>
    /// Получить все сегменты для конкретной песни
    /// </summary>
    Task<List<SongSegment>> GetBySongIdAsync(Guid songId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Получить сегменты по аккорду
    /// </summary>
    Task<List<SongSegment>> GetSegmentsByChordIdAsync(Guid chordId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Получить сегменты по паттерну
    /// </summary>
    Task<List<SongSegment>> GetSegmentsByPatternIdAsync(Guid patternId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Получить сегменты определенного типа для песни
    /// </summary>
    Task<List<SongSegment>> GetSegmentsByTypeAsync(SegmentType type, Guid songId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Получить сегменты сгруппированные по песням
    /// </summary>
    Task<Dictionary<Guid, List<SongSegment>>> GetSegmentsGroupedBySongAsync(List<Guid> songIds, CancellationToken cancellationToken = default);
}
