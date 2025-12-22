using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;
using Domain.Common;

namespace Infrastructure.Services;

public class SongService : ISongService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<SongService> _logger;

    public SongService(IUnitOfWork unitOfWork, ILogger<SongService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Song> CreateSongAsync(
        Guid ownerId,
        string title,
        bool isPublic,
        string genre,
        string theme,
        string? artist = null,
        string? description = null,
        Guid? parentSongId = null,
        CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(ownerId, cancellationToken);
        if (user == null)
            throw new ArgumentException("User not found", nameof(ownerId));

        if (parentSongId.HasValue)
        {
            var parentSong = await _unitOfWork.Songs.GetByIdAsync(parentSongId.Value, cancellationToken);
            if (parentSong == null || !parentSong.IsPublic)
                throw new ArgumentException("Parent song not found or not public", nameof(parentSongId));
        }

        var song = Song.Create(ownerId, title, isPublic, genre, theme, artist, description, null, null, parentSongId);
        song = await _unitOfWork.Songs.CreateAsync(song, cancellationToken);

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
            throw new ArgumentException("Song not found", nameof(songId));

        song.Update(title, artist, genre, theme, description, null, null, isPublic);
        await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);

        _logger.LogInformation("Song updated: {SongId}", songId);
        return song;
    }

    public async Task<SongStructure> BuildSongStructureAsync(
        Guid songId,
        List<SongStructure.SegmentData> segmentDataList,
        Dictionary<int, string>? repeatGroups = null,
        CancellationToken cancellationToken = default)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);
        if (song == null)
            throw new ArgumentException("Song not found", nameof(songId));

        var structure = await _unitOfWork.SongStructures.GetBySongIdAsync(songId, cancellationToken);
        if (structure == null)
        {
            structure = SongStructure.Create(songId);
            structure = await _unitOfWork.SongStructures.CreateAsync(structure, cancellationToken);
        }

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            structure.BuildStructure(segmentDataList, repeatGroups);
            await _unitOfWork.SongStructures.UpdateAsync(structure, cancellationToken);

            song.UpdateFullText();
            await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);

            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }

        _logger.LogInformation("Song structure built for song: {SongId}", songId);
        return structure;
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
            throw new ArgumentException("Song not found", nameof(songId));

        await _unitOfWork.SongStructures.GetWithSegmentsAsync(songId, cancellationToken);
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

        song.AddChord(chordId);
        await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);

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

        song.AddPattern(patternId);
        await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);

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
        return user?.Role == Constants.Roles.Admin;
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

        _logger.LogDebug("Statistics updated for song: {SongId}", songId);
    }
}