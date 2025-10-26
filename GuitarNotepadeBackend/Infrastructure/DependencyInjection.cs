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
                b => b.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName));
        });

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IAuthService, AuthService>();

        return services;
    }

    private static string GetConnectionString()
    {
        try
        {
            var host = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
            var port = Environment.GetEnvironmentVariable("DB_PORT") ?? "5432";
            var database = Environment.GetEnvironmentVariable("DB_NAME") ?? "GuitarNotepad";
            var username = Environment.GetEnvironmentVariable("DB_USER") ?? "niko";
            var password = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "1214";

            var connectionString = $"Host={host};Port={port};Database={database};Username={username};Password={password}";

            return connectionString;
        }
        catch (Exception ex)
        {
            throw new Exception($"Infrastructure - Connection String: {ex.Message}");
        }
    }
}