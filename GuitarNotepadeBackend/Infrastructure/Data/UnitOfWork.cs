using Domain.Interfaces;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Infrastructure.Repositories;

namespace Infrastructure.Data;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;

        Users = new UserRepository(context);
        Chords = new ChordRepository(context);
        StrummingPatterns = new StrummingPatternRepository(context);
        Songs = new SongRepository(context);
        SongReviews = new SongReviewRepository(context);
        ReviewLikes = new ReviewLikeRepository(context);
    }

    public IUserRepository Users { get; }
    public IChordRepository Chords { get; }
    public IStrummingPatternRepository StrummingPatterns { get; }
    public ISongRepository Songs { get; }
    public ISongReviewRepository SongReviews { get; }
    public IReviewLikeRepository ReviewLikes { get; }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}