using Domain.Interfaces;
using Domain.Interfaces.Repositories;
using Domain.Interfaces.Services;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Data;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private readonly ILoggerFactory _loggerFactory;
    private readonly ILogger<UnitOfWork> _logger;
    public AppDbContext Context => _context;

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
        SongComments = new SongCommentRepository(context);
        SongChords = new SongChordRepository(context);
        SongPatterns = new SongPatternRepository(context);
        Alboms = new AlbomRepository(context);
        SongAlboms = new SongAlbomRepository(context);
    }

    public IUserRepository Users { get; }
    public IChordRepository Chords { get; }
    public IStrummingPatternRepository StrummingPatterns { get; }
    public ISongRepository Songs { get; }
    public ISongReviewRepository SongReviews { get; }
    public ISongSegmentRepository SongSegments { get; }
    public ISongStructureRepository SongStructures { get; }
    public ISongSegmentPositionRepository SongSegmentPositions { get; }
    public ISongCommentRepository SongComments { get; }
    public ISongChordRepository SongChords { get; }
    public ISongPatternRepository SongPatterns { get; }
    public IAlbomRepository Alboms { get; }
    public ISongAlbomRepository SongAlboms { get; }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
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
                await transaction.CommitAsync(ct);
                return result;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(ct);
                _logger.LogError(ex, "Transaction failed");
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
                await transaction.CommitAsync(ct);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(ct);
                _logger.LogError(ex, "Transaction failed");
                throw;
            }
        }, cancellationToken);
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
