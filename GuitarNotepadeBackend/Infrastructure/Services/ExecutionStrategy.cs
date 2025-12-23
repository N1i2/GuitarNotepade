using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Data
{
    public class ExecutionStrategy : IExecutionStrategy
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ExecutionStrategy> _logger;

        public ExecutionStrategy(AppDbContext context, ILogger<ExecutionStrategy> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<TResult> ExecuteAsync<TResult>(
            Func<CancellationToken, Task<TResult>> operation,
            CancellationToken cancellationToken = default)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async (ct) =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync(ct);

                try
                {
                    var result = await operation(ct);
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

        public async Task ExecuteAsync(
            Func<CancellationToken, Task> operation,
            CancellationToken cancellationToken = default)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            await strategy.ExecuteAsync(async (ct) =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync(ct);

                try
                {
                    await operation(ct);
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
    }
}