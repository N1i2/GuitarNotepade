using Domain.Interfaces;
using Domain.Interfaces.Repositories;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Data;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private readonly ILoggerFactory _loggerFactory;
    private readonly ILogger<UnitOfWork> _logger;
    private IExecutionStrategy? _executionStrategy;
    private IDbContextTransaction? _currentTransaction;

    public UnitOfWork(
        AppDbContext context,
        ILoggerFactory loggerFactory,
        ILogger<UnitOfWork> logger)
    {
        _context = context;
        _loggerFactory = loggerFactory;
        _logger = logger;

        Users = new UserRepository(context);
        Chords = new ChordRepository(context);
        StrummingPatterns = new StrummingPatternRepository(context);

        Songs = new SongRepository(context, _loggerFactory.CreateLogger<SongRepository>());

        SongReviews = new SongReviewRepository(context);
        SongSegments = new SongSegmentRepository(context);
        SongStructures = new SongStructureRepository(context);
        SongSegmentPositions = new SongSegmentPositionRepository(context);
        SongLabels = new SongLabelRepository(context);
        SegmentLabels = new SegmentLabelRepository(context);
        SongComments = new SongCommentRepository(context);
        SongChords = new SongChordRepository(context);
        SongPatterns = new SongPatternRepository(context);
    }

    public IUserRepository Users { get; }
    public IChordRepository Chords { get; }
    public IStrummingPatternRepository StrummingPatterns { get; }
    public ISongRepository Songs { get; }
    public ISongReviewRepository SongReviews { get; }
    public ISongSegmentRepository SongSegments { get; }
    public ISongStructureRepository SongStructures { get; }
    public ISongSegmentPositionRepository SongSegmentPositions { get; }
    public ISongLabelRepository SongLabels { get; }
    public ISegmentLabelRepository SegmentLabels { get; }
    public ISongCommentRepository SongComments { get; }
    public ISongChordRepository SongChords { get; }
    public ISongPatternRepository SongPatterns { get; }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("BeginTransactionAsync is deprecated. Use ExecuteInTransactionAsync instead.");

        if (_currentTransaction != null)
        {
            throw new InvalidOperationException("A transaction is already in progress");
        }

        _currentTransaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_currentTransaction == null)
        {
            throw new InvalidOperationException("Transaction has not been started");
        }

        await _currentTransaction.CommitAsync(cancellationToken);
        await _currentTransaction.DisposeAsync();
        _currentTransaction = null;
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_currentTransaction == null)
        {
            throw new InvalidOperationException("Transaction has not been started");
        }

        await _currentTransaction.RollbackAsync(cancellationToken);
        await _currentTransaction.DisposeAsync();
        _currentTransaction = null;
    }

    public async Task<TResult> ExecuteInTransactionAsync<TResult>(
        Func<Task<TResult>> operation,
        CancellationToken cancellationToken = default)
    {
        var strategy = _context.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async (ct) =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(ct);

            try
            {
                var result = await operation();
                await SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);
                return result;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(ct);
                _logger.LogError(ex, "Transaction execution failed");
                throw;
            }
        }, cancellationToken);
    }

    public async Task ExecuteInTransactionAsync(
        Func<Task> operation,
        CancellationToken cancellationToken = default)
    {
        var strategy = _context.Database.CreateExecutionStrategy();

        await strategy.ExecuteAsync(async (ct) =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(ct);

            try
            {
                await operation();
                await SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(ct);
                _logger.LogError(ex, "Transaction execution failed");
                throw;
            }
        }, cancellationToken);
    }

    public async Task<TResult> ExecuteInExistingTransactionAsync<TResult>(
        Func<Task<TResult>> operation,
        CancellationToken cancellationToken = default)
    {
        if (_currentTransaction == null)
        {
            throw new InvalidOperationException("No transaction has been started. Call BeginTransactionAsync first.");
        }

        try
        {
            var result = await operation();
            await SaveChangesAsync(cancellationToken);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Operation failed within existing transaction");
            throw;
        }
    }

    public void Dispose()
    {
        _currentTransaction?.Dispose();
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}