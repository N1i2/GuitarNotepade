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
    ISongCommentRepository SongComments { get; }
    ISongChordRepository SongChords { get; }
    ISongPatternRepository SongPatterns { get; }
    IAlbomRepository Alboms { get; }
    ISongAlbomRepository SongAlboms { get; }
    ISubscriptionRepository Subscriptions { get; }
    INotificationRepository Notifications { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    Task<TResult> ExecuteInTransactionAsync<TResult>(
           Func<Task<TResult>> operation,
           CancellationToken cancellationToken = default);

    Task ExecuteInTransactionAsync(
        Func<Task> operation,
        CancellationToken cancellationToken = default);
}
