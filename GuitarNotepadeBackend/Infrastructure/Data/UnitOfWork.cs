using Domain.Interfaces;
using Domain.Interfaces.Repositories;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore.Storage;

namespace Infrastructure.Data;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private IDbContextTransaction? _transaction;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;

        Users = new UserRepository(context);
        Chords = new ChordRepository(context);
        StrummingPatterns = new StrummingPatternRepository(context);
        Songs = new SongRepository(context);
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
        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction == null)
        {
            throw new InvalidOperationException("Transaction has not been started");
        }

        await _transaction.CommitAsync(cancellationToken);
        await _transaction.DisposeAsync();
        _transaction = null;
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction == null)
        {
            throw new InvalidOperationException("Transaction has not been started");
        }

        await _transaction.RollbackAsync(cancellationToken);
        await _transaction.DisposeAsync();
        _transaction = null;
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}