using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class PatternService : IPatternService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PatternService> _logger;

    public PatternService(IUnitOfWork unitOfWork, ILogger<PatternService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<StrummingPattern> CreatePatternAsync(
        string name,
        string pattern,
        bool isFingerStyle,
        Guid userId,
        string? description = null,
        CancellationToken cancellationToken = default)
    {
        // Проверка на уникальность названия
        if (await _unitOfWork.StrummingPatterns.ExistsWithSameNameAsync(name, cancellationToken))
            throw new InvalidOperationException($"Pattern with name '{name}' already exists");

        var newPattern = StrummingPattern.Create(name, pattern, isFingerStyle, userId, description);
        newPattern = await _unitOfWork.StrummingPatterns.CreateAsync(newPattern, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Pattern created: {PatternId} - {PatternName} by user {UserId}",
            newPattern.Id,
            newPattern.Name,
            userId);

        return newPattern;
    }

    public async Task<StrummingPattern> UpdatePatternAsync(
        Guid patternId,
        Guid userId,
        string? name = null,
        string? pattern = null,
        bool? isFingerStyle = null,
        string? description = null,
        CancellationToken cancellationToken = default)
    {
        var existingPattern = await _unitOfWork.StrummingPatterns.GetByIdAsync(patternId, cancellationToken);
        if (existingPattern == null)
            throw new KeyNotFoundException($"Pattern with ID {patternId} not found");

        // Проверка прав: только создатель или админ
        if (!existingPattern.IsCreatedBy(userId))
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
            if (user?.Role != Constants.Roles.Admin)
                throw new UnauthorizedAccessException("Only owner or admin can update this pattern");
        }

        // Если меняется название - проверяем уникальность
        if (name != null && name != existingPattern.Name)
        {
            if (await _unitOfWork.StrummingPatterns.ExistsWithSameNameAsync(name, cancellationToken))
                throw new InvalidOperationException($"Pattern with name '{name}' already exists");
        }

        existingPattern.Update(name, pattern, isFingerStyle, description);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Pattern updated: {PatternId} by user {UserId}", patternId, userId);
        return existingPattern;
    }

    public async Task DeletePatternAsync(
        Guid patternId,
        Guid userId,
        string userRole,
        CancellationToken cancellationToken = default)
    {
        var pattern = await _unitOfWork.StrummingPatterns.GetByIdAsync(patternId, cancellationToken);
        if (pattern == null)
            throw new KeyNotFoundException($"Pattern with ID {patternId} not found");

        // Проверка прав: только создатель или админ
        if (!pattern.IsCreatedBy(userId) && userRole != Constants.Roles.Admin)
            throw new UnauthorizedAccessException("Only owner or admin can delete this pattern");

        // Проверяем, используется ли паттерн в каких-либо песнях
        var songsWithPattern = await _unitOfWork.SongPatterns.GetSongIdsForPatternAsync(patternId, cancellationToken);
        if (songsWithPattern.Any())
        {
            _logger.LogWarning(
                "Attempted to delete pattern {PatternId} which is used in {Count} songs",
                patternId,
                songsWithPattern.Count);

            throw new InvalidOperationException(
                $"Cannot delete pattern that is used in {songsWithPattern.Count} songs. Remove it from songs first.");
        }

        await _unitOfWork.StrummingPatterns.DeleteAsync(patternId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Pattern deleted: {PatternId} by user {UserId}", patternId, userId);
    }

    public async Task<StrummingPattern> GetPatternByIdAsync(Guid patternId, CancellationToken cancellationToken = default)
    {
        var pattern = await _unitOfWork.StrummingPatterns.GetByIdAsync(patternId, cancellationToken);
        if (pattern == null)
            throw new KeyNotFoundException($"Pattern with ID {patternId} not found");

        return pattern;
    }

    public async Task<List<StrummingPattern>> GetUserPatternsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.StrummingPatterns.GetByUserIdAsync(userId, cancellationToken);
    }

    public async Task<bool> ExistsWithSameNameAsync(string name, CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.StrummingPatterns.ExistsWithSameNameAsync(name, cancellationToken);
    }
}