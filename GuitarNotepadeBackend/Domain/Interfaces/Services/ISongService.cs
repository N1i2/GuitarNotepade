using Domain.Common;
using Domain.Entities;

namespace Domain.Interfaces.Services;

public interface ISongService
{
    Task<Song> CreateSongAsync(
        Guid ownerId,
        string title,
        bool isPublic,
        string? artist = null,
        string? description = null,
        Guid? parentSongId = null,
        CancellationToken cancellationToken = default);

    Task<Song> UpdateSongAsync(
        Guid songId,
        string? title = null,
        string? artist = null,
        string? description = null,
        bool? isPublic = null,
        string? key = null,
        string? difficulty = null,
        CancellationToken cancellationToken = default);

    Task<SongStructure> BuildSongStructureAsync(
        Guid songId,
        List<SongStructure.SegmentData> segmentDataList,
        Dictionary<int, string>? repeatGroups = null,
        CancellationToken cancellationToken = default);

    Task<Song> CreateSongFromExistingAsync(
        Guid originalSongId,
        Guid newOwnerId,
        CancellationToken cancellationToken = default);

    Task<Song> GetSongWithStructureAsync(
        Guid songId,
        CancellationToken cancellationToken = default);

    Task AddChordToSongAsync(
        Guid songId,
        Guid chordId,
        CancellationToken cancellationToken = default);

    Task AddPatternToSongAsync(
        Guid songId,
        Guid patternId,
        CancellationToken cancellationToken = default);

    Task RemoveChordFromSongAsync(
        Guid songId,
        Guid chordId,
        CancellationToken cancellationToken = default);

    Task RemovePatternFromSongAsync(
        Guid songId,
        Guid patternId,
        CancellationToken cancellationToken = default);

    Task<List<Song>> SearchSongsAsync(
        string searchTerm,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);

    Task<List<Song>> GetUserSongsAsync(
        Guid userId,
        bool includePrivate = false,
        CancellationToken cancellationToken = default);

    Task<bool> CanUserAccessSongAsync(
        Guid userId,
        Guid songId,
        CancellationToken cancellationToken = default);

    Task UpdateSongStatisticsAsync(
        Guid songId,
        CancellationToken cancellationToken = default);
}
