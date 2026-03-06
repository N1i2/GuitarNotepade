using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface ISongSegmentPositionRepository : IBaseRepository<SongSegmentPosition>
{
    /// <summary>
    /// Получить все позиции для песни
    /// </summary>
    Task<List<SongSegmentPosition>> GetBySongIdAsync(Guid songId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Получить все позиции для сегмента
    /// </summary>
    Task<List<SongSegmentPosition>> GetBySegmentIdAsync(Guid segmentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Получить все позиции для песни с полными данными сегментов
    /// </summary>
    Task<List<SongSegmentPosition>> GetBySongIdOrderedAsync(Guid songId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Получить словарь позиций для быстрого доступа
    /// </summary>
    Task<Dictionary<int, SongSegmentPosition>> GetPositionsMapAsync(Guid songId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Получить максимальный индекс позиции в песне
    /// </summary>
    Task<int> GetMaxPositionIndexAsync(Guid songId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Проверить, существует ли позиция с указанным индексом
    /// </summary>
    Task<bool> HasPositionAtIndexAsync(Guid songId, int positionIndex, CancellationToken cancellationToken = default);

    /// <summary>
    /// Обновить индексы позиций после указанной
    /// </summary>
    Task UpdatePositionsAfterIndexAsync(Guid songId, int fromIndex, int increment, CancellationToken cancellationToken = default);

    /// <sammary>
    /// Метод для удаления позиции сегмента
    /// </sammary>
    Task<bool> DeletePositionWithSegmentIfUnusedAsync(Guid positionId, CancellationToken cancellationToken = default);
}
