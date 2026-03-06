using Domain.Common;
using Domain.Entities;

namespace Domain.Interfaces.Services;

public interface ISongSegmentService
{
    /// <summary>
    /// Создать новый сегмент песни
    /// </summary>
    Task<SongSegment> CreateSegmentAsync(
        SegmentType type,
        string? lyric = null,
        Guid? chordId = null,
        Guid? patternId = null,
        int? duration = null,
        string? description = null,
        string? color = null,
        string? backgroundColor = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Обновить существующий сегмент.
    /// ВНИМАНИЕ: Изменения применятся ко ВСЕМ позициям, где используется этот сегмент!
    /// </summary>
    Task<SongSegment> UpdateSegmentAsync(
        Guid segmentId,
        string? lyric = null,
        Guid? chordId = null,
        Guid? patternId = null,
        int? duration = null,
        string? description = null,
        string? color = null,
        string? backgroundColor = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Заменить сегмент на конкретной позиции.
    /// Создает новый сегмент, старый сегмент НЕ изменяется.
    /// </summary>
    Task ReplaceSegmentAtPositionAsync(
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
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Получить все сегменты для песни
    /// </summary>
    Task<List<SongSegment>> GetSegmentsForSongAsync(
        Guid songId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Получить сегменты, сгруппированные по повторяющимся группам (припев, куплет и т.д.)
    /// </summary>
    Task<Dictionary<string, List<SongSegment>>> GetSegmentsGroupedByRepeatAsync(
        Guid songId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Найти существующий сегмент в песне по данным или создать новый.
    /// Используется для предотвращения дублирования одинаковых сегментов в одной песне.
    /// </summary>
    Task<SongSegment> GetOrCreateSegmentForSongAsync(
        Guid songId,
        SegmentType type,
        string? lyric = null,
        Guid? chordId = null,
        Guid? patternId = null,
        int? duration = null,
        string? description = null,
        string? color = null,
        string? backgroundColor = null,
        CancellationToken cancellationToken = default);
}
