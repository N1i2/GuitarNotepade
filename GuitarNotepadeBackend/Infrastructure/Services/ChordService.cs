using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class ChordService : IChordService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<ChordService> _logger;

    public ChordService(IUnitOfWork unitOfWork, ILogger<ChordService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Chord> CreateChordAsync(
        string name,
        string fingering,
        Guid userId,
        string? description = null,
        CancellationToken cancellationToken = default)
    {
        if (await _unitOfWork.Chords.ExistsWithSameFingeringAsync(name, fingering, cancellationToken))
            throw new InvalidOperationException($"Chord with name '{name}' and fingering '{fingering}' already exists");

        var chord = Chord.Create(name, fingering, userId, description);
        chord = await _unitOfWork.Chords.CreateAsync(chord, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Chord created: {ChordId} - {ChordName} by user {UserId}",
            chord.Id,
            chord.Name,
            userId);

        return chord;
    }

    public async Task<Chord> UpdateChordAsync(
        Guid chordId,
        Guid userId,
        string? name = null,
        string? fingering = null,
        string? description = null,
        CancellationToken cancellationToken = default)
    {
        var chord = await _unitOfWork.Chords.GetByIdAsync(chordId, cancellationToken);
        if (chord == null)
            throw new KeyNotFoundException($"Chord with ID {chordId} not found");

        if (!chord.IsCreatedBy(userId))
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
            if (user?.Role != Constants.Roles.Admin)
                throw new UnauthorizedAccessException("Only owner or admin can update this chord");
        }

        if ((name != null && name != chord.Name) ||
            (fingering != null && fingering != chord.Fingering))
        {
            var newName = name ?? chord.Name;
            var newFingering = fingering ?? chord.Fingering;

            if (await _unitOfWork.Chords.ExistsWithSameFingeringAsync(newName, newFingering, cancellationToken))
                throw new InvalidOperationException($"Chord with name '{newName}' and fingering '{newFingering}' already exists");
        }

        chord.Update(name, fingering, description);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Chord updated: {ChordId} by user {UserId}", chordId, userId);
        return chord;
    }

    public async Task DeleteChordAsync(
        Guid chordId,
        Guid userId,
        string userRole,
        CancellationToken cancellationToken = default)
    {
        var chord = await _unitOfWork.Chords.GetByIdAsync(chordId, cancellationToken);
        if (chord == null)
            throw new KeyNotFoundException($"Chord with ID {chordId} not found");

        if (!chord.IsCreatedBy(userId) && userRole != Constants.Roles.Admin)
            throw new UnauthorizedAccessException("Only owner or admin can delete this chord");

        var songsWithChord = await _unitOfWork.SongChords.GetSongIdsForChordAsync(chordId, cancellationToken);
        if (songsWithChord.Any())
        {
            _logger.LogWarning(
                "Attempted to delete chord {ChordId} which is used in {Count} songs",
                chordId,
                songsWithChord.Count);

            throw new InvalidOperationException(
                $"Cannot delete chord that is used in {songsWithChord.Count} songs. Remove it from songs first.");
        }

        await _unitOfWork.Chords.DeleteAsync(chordId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Chord deleted: {ChordId} by user {UserId}", chordId, userId);
    }

    public async Task<Chord> GetChordByIdAsync(Guid chordId, CancellationToken cancellationToken = default)
    {
        var chord = await _unitOfWork.Chords.GetByIdAsync(chordId, cancellationToken);
        if (chord == null)
            throw new KeyNotFoundException($"Chord with ID {chordId} not found");

        return chord;
    }

    public async Task<List<Chord>> GetUserChordsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.Chords.GetByUserIdAsync(userId, cancellationToken);
    }

    public async Task<bool> ExistsWithSameFingeringAsync(
        string name,
        string fingering,
        CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.Chords.ExistsWithSameFingeringAsync(name, fingering, cancellationToken);
    }
}