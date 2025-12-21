using Domain.Interfaces;
using Domain.Interfaces.Repositories;
using Domain.Interfaces.Services;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

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

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IChordRepository, ChordRepository>();
        services.AddScoped<IStrummingPatternRepository, StrummingPatternRepository>();
        services.AddScoped<ISongRepository, SongRepository>();
        services.AddScoped<ISongReviewRepository, SongReviewRepository>();
        services.AddScoped<ISongSegmentRepository, SongSegmentRepository>();
        services.AddScoped<ISongStructureRepository, SongStructureRepository>();
        services.AddScoped<ISongSegmentPositionRepository, SongSegmentPositionRepository>();
        services.AddScoped<ISongLabelRepository, SongLabelRepository>();
        services.AddScoped<ISegmentLabelRepository, SegmentLabelRepository>();
        services.AddScoped<ISongCommentRepository, SongCommentRepository>();
        services.AddScoped<ISongChordRepository, SongChordRepository>();
        services.AddScoped<ISongPatternRepository, SongPatternRepository>();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IFileStorageService, FileStorageService>();

        services.AddScoped<ISongService, SongService>();
        services.AddScoped<ISongReviewService, SongReviewService>();
        services.AddScoped<ISongSegmentService, SongSegmentService>();
        services.AddScoped<ISongLabelService, SongLabelService>();
        services.AddScoped<ISongCommentService, SongCommentService>();
        services.AddScoped<ISongStatisticsService, SongStatisticsService>();

        services.AddHttpClient<IWebDavService, WebDavService>((serviceProvider, client) =>
        {
            var baseUrl = Environment.GetEnvironmentVariable("YANDEX_DISK_BASE_URL") ?? "https://webdav.yandex.ru";
            client.BaseAddress = new Uri(baseUrl);
            client.Timeout = TimeSpan.FromSeconds(30);
            client.DefaultRequestHeaders.Add("User-Agent", "GuitarNotepad");
        });

        services.AddMemoryCache();

        return services;
    }

    private static string GetConnectionString()
    {
        try
        {
            var host = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
            var port = Environment.GetEnvironmentVariable("DB_PORT") ?? "5432";
            var database = Environment.GetEnvironmentVariable("DB_NAME") ?? "guitarnotepad";
            var username = Environment.GetEnvironmentVariable("DB_USER") ?? "postgres";
            var password = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "password";
            var pooling = Environment.GetEnvironmentVariable("DB_POOLING") ?? "true";
            var minPoolSize = Environment.GetEnvironmentVariable("DB_MIN_POOL_SIZE") ?? "1";
            var maxPoolSize = Environment.GetEnvironmentVariable("DB_MAX_POOL_SIZE") ?? "20";
            var commandTimeout = Environment.GetEnvironmentVariable("DB_COMMAND_TIMEOUT") ?? "30";

            var connectionString = $"Host={host};Port={port};Database={database};" +
                                  $"Username={username};Password={password};" +
                                  $"Pooling={pooling};Minimum Pool Size={minPoolSize};" +
                                  $"Maximum Pool Size={maxPoolSize};CommandTimeout={commandTimeout};" +
                                  $"Include Error Detail=true";

            return connectionString;
        }
        catch (Exception ex)
        {
            throw new Exception($"Infrastructure - Connection String: {ex.Message}");
        }
    }
}