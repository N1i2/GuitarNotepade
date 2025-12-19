using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface ISongChordRepository : IBaseRepository<SongChord>
{
    Task<List<SongChord>> GetBySongIdAsync(
        Guid songId,
        CancellationToken cancellationToken = default);

    Task<List<SongChord>> GetByChordIdAsync(
        Guid chordId,
        CancellationToken cancellationToken = default);

    Task<SongChord?> GetBySongAndChordAsync(
        Guid songId,
        Guid chordId,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(
        Guid songId,
        Guid chordId,
        CancellationToken cancellationToken = default);

    Task<int> CountByChordIdAsync(
        Guid chordId,
        CancellationToken cancellationToken = default);

    Task<List<Guid>> GetChordIdsForSongAsync(
        Guid songId,
        CancellationToken cancellationToken = default);

    Task<List<Guid>> GetSongIdsForChordAsync(
        Guid chordId,
        CancellationToken cancellationToken = default);
}