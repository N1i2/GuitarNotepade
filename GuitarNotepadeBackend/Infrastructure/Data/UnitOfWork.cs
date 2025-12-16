using Domain.Interfaces;
using Domain.Interfaces.Repositories;
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
    }

    public IUserRepository Users { get; }
    public IChordRepository Chords { get; }
    public IStrummingPatternRepository StrummingPatterns { get; }

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