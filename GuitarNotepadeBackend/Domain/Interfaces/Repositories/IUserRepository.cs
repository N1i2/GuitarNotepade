using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface IUserRepository: IBaseRepository<User>
{
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User?> GetByNikNameAsync(string nikName, CancellationToken cancellationToken = default);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> ExistsByNikNameAsync(string nikName, CancellationToken cancellationToken = default);
}
