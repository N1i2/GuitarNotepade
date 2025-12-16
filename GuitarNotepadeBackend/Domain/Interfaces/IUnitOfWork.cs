using Domain.Interfaces.Repositories;

namespace Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    IChordRepository Chords { get; }
    IStrummingPatternRepository StrummingPatterns { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}