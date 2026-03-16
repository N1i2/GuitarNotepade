using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Npgsql;
using DotNetEnv;

namespace Infrastructure.Data
{
    public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            var currentDir = Directory.GetCurrentDirectory();
            Console.WriteLine($"Current directory: {currentDir}");

            string? presentationDir = null;
            var dir = new DirectoryInfo(currentDir);

            while (dir != null)
            {
                if (dir.GetDirectories("Presentation").Any())
                {
                    presentationDir = Path.Combine(dir.FullName, "Presentation");
                    break;
                }
                dir = dir.Parent;
            }

            if (presentationDir != null)
            {
                var envFile = Path.Combine(presentationDir, ".env");
                Console.WriteLine($"Looking for .env at: {envFile}");

                if (File.Exists(envFile))
                {
                    Console.WriteLine("Loading .env file...");
                    Env.Load(envFile);
                }
                else
                {
                    Console.WriteLine(".env file not found, using environment variables");
                }
            }

            var host = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
            var port = Environment.GetEnvironmentVariable("DB_PORT") ?? "5432";
            var database = Environment.GetEnvironmentVariable("DB_NAME") ?? "guitarnotepad";
            var username = Environment.GetEnvironmentVariable("DB_USER") ?? "postgres";
            var password = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "postgres";

            var pooling = Environment.GetEnvironmentVariable("DB_POOLING") ?? "true";
            var minPoolSize = Environment.GetEnvironmentVariable("DB_MIN_POOL_SIZE") ?? "5";
            var maxPoolSize = Environment.GetEnvironmentVariable("DB_MAX_POOL_SIZE") ?? "20";
            var commandTimeout = Environment.GetEnvironmentVariable("DB_COMMAND_TIMEOUT") ?? "30";

            Console.WriteLine($"DB_HOST: {host}");
            Console.WriteLine($"DB_NAME: {database}");
            Console.WriteLine($"DB_USER: {username}");

            var connectionString = new NpgsqlConnectionStringBuilder
            {
                Host = host,
                Port = int.Parse(port),
                Database = database,
                Username = username,
                Password = password,
                Pooling = bool.Parse(pooling),
                MinPoolSize = int.Parse(minPoolSize),
                MaxPoolSize = int.Parse(maxPoolSize),
                CommandTimeout = int.Parse(commandTimeout)
            }.ToString();

            Console.WriteLine($"Connection string built successfully");

            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
            optionsBuilder.UseNpgsql(connectionString);

            return new AppDbContext(optionsBuilder.Options);
        }
    }
}