using Domain.Interfaces.Services;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Infrastructure.Data;
using Infrastructure.Services;

namespace Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
        {
            var connectionString = GetConnectionString();
            options.UseNpgsql(connectionString,
                b => {
                    b.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                    b.EnableRetryOnFailure(
                        maxRetryCount: 3,
                        maxRetryDelay: TimeSpan.FromSeconds(5),
                        errorCodesToAdd: null);
                    b.CommandTimeout(30); 
                });
        }, ServiceLifetime.Scoped); 

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IAuthService, AuthService>();

        return services;
    }

    private static string GetConnectionString()
    {
        try
        {
            var host = Environment.GetEnvironmentVariable("DB_HOST");
            var port = Environment.GetEnvironmentVariable("DB_PORT");
            var database = Environment.GetEnvironmentVariable("DB_NAME");
            var username = Environment.GetEnvironmentVariable("DB_USER");
            var password = Environment.GetEnvironmentVariable("DB_PASSWORD");
            var pooling = Environment.GetEnvironmentVariable("DB_POOLING");
            var minPoolSize = Environment.GetEnvironmentVariable("DB_MIN_POOL_SIZE");
            var maxPoolSize = Environment.GetEnvironmentVariable("DB_MAX_POOL_SIZE");
            var commandTimeout = Environment.GetEnvironmentVariable("DB_COMMAND_TIMEOUT");

            var connectionString = $"Host={host};Port={port};Database={database};" +
                                  $"Username={username};Password={password};" +
                                  $"Pooling={pooling};Minimum Pool Size={minPoolSize};" +
                                  $"Maximum Pool Size={maxPoolSize};CommandTimeout={commandTimeout}";

            return connectionString;
        }
        catch (Exception ex)
        {
            throw new Exception($"Infrastructure - Connection String: {ex.Message}");
        }
    }
}