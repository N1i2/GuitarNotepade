using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Domain.Common;

namespace Infrastructure.Services;

public class SongService : ISongService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISongSegmentService _songSegmentService;
    private readonly ILogger<SongService> _logger;

    public SongService(
        IUnitOfWork unitOfWork,
        ISongSegmentService songSegmentService,
        ILogger<SongService> logger)
    {
        _unitOfWork = unitOfWork;
        _songSegmentService = songSegmentService;
        _logger = logger;
    }

    public async Task<Song> CreateSongAsync(
        Guid ownerId,
        string title,
        bool isPublic,
        string? genre = null,
        string? theme = null,
        string? artist = null,
        string? description = null,
        Guid? parentSongId = null,
        CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(ownerId, cancellationToken);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(ownerId));
        }

        if (parentSongId.HasValue)
        {
            var parentSong = await _unitOfWork.Songs.GetByIdAsync(parentSongId.Value, cancellationToken);
            if (parentSong == null || !parentSong.IsPublic)
                throw new ArgumentException("Parent song not found or not public", nameof(parentSongId));
        }

        var song = Song.Create(ownerId, title, isPublic, genre, theme, artist, description, null, null, parentSongId);
        song = await _unitOfWork.Songs.CreateAsync(song, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Song created: {SongId} by user {UserId}", song.Id, ownerId);
        return song;
    }

    public async Task<Song> UpdateSongAsync(
        Guid songId,
        string? title = null,
        string? genre = null,
        string? theme = null,
        string? artist = null,
        string? description = null,
        bool? isPublic = null,
        CancellationToken cancellationToken = default)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);

        if (song == null)
        {
            throw new ArgumentException("Song not found", nameof(songId));
        }

        song.Update(title, artist, genre, theme, description, null, null, isPublic);
        await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Song updated: {SongId}", songId);
        return song;
    }

    public async Task<SongStructure> BuildSongStructureAsync(
        Guid songId,
        List<SongStructure.SegmentData> segmentDataList,
        Dictionary<int, string>? repeatGroups = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Начало BuildSongStructure для песни {SongId} с {Count} сегментами",
            songId, segmentDataList.Count);

        return await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            _logger.LogDebug("Транзакция начата. Загружаем песню...");

            var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);

            if (song == null)
            {
                throw new ArgumentException("Песня не найдена", nameof(songId));
            }

            var structure = await _unitOfWork.SongStructures
                .GetWithSegmentsAsync(songId, cancellationToken);

            if (structure == null)
            {
                structure = SongStructure.Create(songId);
                await _unitOfWork.SongStructures.AddAsync(structure, cancellationToken);
                _logger.LogDebug("Создана новая структура для песни {SongId}", songId);
            }

            var oldSegmentIds = structure.SegmentPositions?
                .Select(sp => sp.SegmentId)
                .Distinct()
                .ToList() ?? new List<Guid>();

            _logger.LogDebug("Найдено {Count} старых сегментов", oldSegmentIds.Count);

            foreach (var position in structure.SegmentPositions?.ToList() ?? new List<SongSegmentPosition>())
            {
                await _unitOfWork.SongSegmentPositions.DeleteAsync(position.Id, cancellationToken);
            }

            structure.SegmentPositions?.Clear();

            var usedSegmentIds = new HashSet<Guid>();
            var positionIndex = 0;

            foreach (var segmentData in segmentDataList)
            {
                var segment = await GetOrCreateSegmentInternalAsync(segmentData, cancellationToken);
                usedSegmentIds.Add(segment.Id);

                var repeatGroup = repeatGroups?.GetValueOrDefault(positionIndex);

                var position = SongSegmentPosition.Create(
                    songId: songId,
                    segmentId: segment.Id,
                    positionIndex: positionIndex,
                    repeatGroup: repeatGroup);

                await _unitOfWork.SongSegmentPositions.AddAsync(position, cancellationToken);

                structure.SegmentPositions?.Add(position);

                positionIndex++;
            }

            _logger.LogDebug("Создано {Count} новых позиций", positionIndex);

            var segmentsToRemove = new List<Guid>();

            foreach (var oldSegmentId in oldSegmentIds)
            {
                if (usedSegmentIds.Contains(oldSegmentId))
                    continue;

                var otherUsages = await _unitOfWork.SongSegmentPositions
                    .GetQueryable()
                    .CountAsync(sp => sp.SegmentId == oldSegmentId && sp.SongId != songId, cancellationToken);

                if (otherUsages == 0)
                {
                    segmentsToRemove.Add(oldSegmentId);
                    _logger.LogDebug("Сегмент {SegmentId} будет удален", oldSegmentId);
                }
            }

            foreach (var segmentId in segmentsToRemove)
            {
                await _unitOfWork.SongSegments.DeleteAsync(segmentId, cancellationToken);
            }

            await _unitOfWork.SongStructures.UpdateAsync(structure, cancellationToken);
            song.UpdateFullText();
            await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);

            var saveResult = await _unitOfWork.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Структура сохранена. Затронуто строк: {SaveResult}", saveResult);

            if (saveResult == 0)
            {
                _logger.LogWarning("No changes saved for song structure {SongId}", songId);
            }

            return await _unitOfWork.SongStructures.GetWithSegmentsAsync(songId, cancellationToken)
                   ?? throw new InvalidOperationException("Не удалось загрузить созданную структуру");

        }, cancellationToken);
    }


    private async Task<SongSegment> GetOrCreateSegmentInternalAsync(
     SongStructure.SegmentData segmentData,
     CancellationToken cancellationToken)
    {
        var hash = SongSegment.CalculateContentHash(
            segmentData.Lyric,
            segmentData.ChordId,
            segmentData.PatternId);

        var existingSegment = await _unitOfWork.SongSegments
            .GetQueryable()
            .FirstOrDefaultAsync(s => s.ContentHash == hash, cancellationToken);

        if (existingSegment != null)
        {
            _logger.LogTrace("Найден существующий сегмент {SegmentId}", existingSegment.Id);
            return existingSegment;
        }

        var newSegment = SongSegment.Create(
            type: segmentData.Type,
            lyric: segmentData.Lyric,
            chordId: segmentData.ChordId,
            patternId: segmentData.PatternId,
            duration: segmentData.Duration,
            description: segmentData.Description,
            color: segmentData.Color,
            backgroundColor: segmentData.BackgroundColor);

        await _unitOfWork.SongSegments.AddAsync(newSegment, cancellationToken);

        _logger.LogDebug("Создан новый сегмент {SegmentId}", newSegment.Id);
        return newSegment;
    }

    public async Task<Song> CreateSongFromExistingAsync(
        Guid originalSongId,
        Guid newOwnerId,
        CancellationToken cancellationToken = default)
    {
        var originalSong = await _unitOfWork.Songs.GetByIdAsync(originalSongId, cancellationToken);
        if (originalSong == null)
            throw new ArgumentException("Original song not found", nameof(originalSongId));

        var user = await _unitOfWork.Users.GetByIdAsync(newOwnerId, cancellationToken);
        if (user == null)
            throw new ArgumentException("User not found", nameof(newOwnerId));

        var newSong = Song.CreateFromExisting(originalSong, newOwnerId);
        newSong = await _unitOfWork.Songs.CreateAsync(newSong, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Song copied: {OriginalSongId} -> {NewSongId} by user {UserId}",
            originalSongId, newSong.Id, newOwnerId);
        return newSong;
    }

    public async Task<Song> GetSongWithStructureAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);
        if (song == null)
        {
            throw new ArgumentException("Song not found", nameof(songId));
        }

        var structure = await _unitOfWork.SongStructures.GetWithSegmentsAsync(songId, cancellationToken);

        if (structure != null)
        {
            _logger.LogDebug("Loaded structure with {SegmentCount} segments for song {SongId}",
                structure.SegmentPositions?.Count ?? 0, songId);
        }

        return song;
    }

    public async Task AddChordToSongAsync(
        Guid songId,
        Guid chordId,
        CancellationToken cancellationToken = default)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);
        if (song == null)
            throw new ArgumentException("Song not found", nameof(songId));

        var chord = await _unitOfWork.Chords.GetByIdAsync(chordId, cancellationToken);
        if (chord == null)
            throw new ArgumentException("Chord not found", nameof(chordId));

        if (song.SongChords.Any(sc => sc.ChordId == chordId))
        {
            _logger.LogDebug("Chord {ChordId} already exists in song {SongId}", chordId, songId);
            return;
        }

        song.AddChord(chordId);

        _logger.LogInformation("Chord {ChordId} added to song {SongId}", chordId, songId);
    }

    public async Task AddPatternToSongAsync(
        Guid songId,
        Guid patternId,
        CancellationToken cancellationToken = default)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);
        if (song == null)
            throw new ArgumentException("Song not found", nameof(songId));

        var pattern = await _unitOfWork.StrummingPatterns.GetByIdAsync(patternId, cancellationToken);
        if (pattern == null)
            throw new ArgumentException("Pattern not found", nameof(patternId));

        if (song.SongPatterns.Any(sp => sp.StrummingPatternId == patternId))
        {
            _logger.LogDebug("Pattern {PatternId} already exists in song {SongId}", patternId, songId);
            return;
        }

        song.AddPattern(patternId);
        await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Pattern {PatternId} added to song {SongId}", patternId, songId);
    }

    public async Task RemoveChordFromSongAsync(
        Guid songId,
        Guid chordId,
        CancellationToken cancellationToken = default)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);
        if (song == null)
            throw new ArgumentException("Song not found", nameof(songId));

        song.RemoveChord(chordId);
        await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Chord {ChordId} removed from song {SongId}", chordId, songId);
    }

    public async Task RemovePatternFromSongAsync(
        Guid songId,
        Guid patternId,
        CancellationToken cancellationToken = default)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);
        if (song == null)
            throw new ArgumentException("Song not found", nameof(songId));

        song.RemovePattern(patternId);
        await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Pattern {PatternId} removed from song {SongId}", patternId, songId);
    }

    public async Task<List<Song>> SearchSongsAsync(
        string searchTerm,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.Songs.SearchAsync(searchTerm, page, pageSize, cancellationToken);
    }

    public async Task<List<Song>> GetUserSongsAsync(
        Guid userId,
        bool includePrivate = false,
        CancellationToken cancellationToken = default)
    {
        var songs = await _unitOfWork.Songs.GetByUserIdAsync(userId, cancellationToken);

        if (!includePrivate)
        {
            songs = songs.Where(s => s.IsPublic).ToList();
        }

        return songs;
    }

    public async Task<bool> CanUserAccessSongAsync(
        Guid userId,
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);
        if (song == null)
            return false;

        if (song.IsPublic)
            return true;

        if (song.OwnerId == userId)
            return true;

        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        return user?.Role == Domain.Common.Constants.Roles.Admin;
    }

    public async Task UpdateSongStatisticsAsync(
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);
        if (song == null)
            throw new ArgumentException("Song not found", nameof(songId));

        song.UpdateStatistics();
        await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogDebug("Statistics updated for song: {SongId}", songId);
    }

    public async Task<bool> CanUserCreateMoreSongsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user == null)
            return false;

        if (user.IsPremium || user.IsAdmin)
            return true;

        var songsCount = await GetUserSongsCountAsync(userId, true, cancellationToken);
        return songsCount < Constants.Limits.FreeUserMaxSongs;
    }

    public async Task<int> GetUserSongsCountAsync(Guid userId, bool includePrivate = true, CancellationToken cancellationToken = default)
    {
        var query = _unitOfWork.Songs.GetQueryable()
            .Where(s => s.OwnerId == userId);

        if (!includePrivate)
        {
            query = query.Where(s => s.IsPublic);
        }

        return await query.CountAsync(cancellationToken);
    }
}
