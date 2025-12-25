using Domain.Interfaces.Repositories;

namespace Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    IChordRepository Chords { get; }
    IStrummingPatternRepository StrummingPatterns { get; }
    ISongRepository Songs { get; }
    ISongReviewRepository SongReviews { get; }
    ISongSegmentRepository SongSegments { get; }
    ISongStructureRepository SongStructures { get; }
    ISongSegmentPositionRepository SongSegmentPositions { get; }
    ISongLabelRepository SongLabels { get; }
    ISegmentLabelRepository SegmentLabels { get; }
    ISongCommentRepository SongComments { get; }
    ISongChordRepository SongChords { get; }
    ISongPatternRepository SongPatterns { get; }
    IAlbomRepository Alboms { get; }
    ISongAlbomRepository SongAlboms { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);

    Task<TResult> ExecuteInTransactionAsync<TResult>(
           Func<Task<TResult>> operation,
           CancellationToken cancellationToken = default);

    Task ExecuteInTransactionAsync(
        Func<Task> operation,
        CancellationToken cancellationToken = default);

    Task<TResult> ExecuteInExistingTransactionAsync<TResult>(
        Func<Task<TResult>> operation,
        CancellationToken cancellationToken = default);
}