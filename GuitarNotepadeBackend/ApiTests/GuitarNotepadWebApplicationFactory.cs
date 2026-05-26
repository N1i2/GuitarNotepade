using Domain.Interfaces.Services;
using Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ApiTests;

public class GuitarNotepadWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly string _dbName = $"TestDb_{Guid.NewGuid():N}";

    public async Task InitializeAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
    }

    public new Task DisposeAsync() => Task.CompletedTask;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        Environment.SetEnvironmentVariable("USE_INMEMORY_DB", "true");
        Environment.SetEnvironmentVariable("INMEMORY_DB_NAME", _dbName);
        Environment.SetEnvironmentVariable(
            "JWT_SECRET",
            "unit-test-jwt-secret-key-32chars-min!!");
        Environment.SetEnvironmentVariable("JWT_ISSUER", "GuitarNotepadTest");
        Environment.SetEnvironmentVariable("JWT_AUDIENCE", "GuitarNotepadTestUsers");
        Environment.SetEnvironmentVariable("YANDEX_DISK_BASE_URL", "https://webdav.yandex.ru");
        Environment.SetEnvironmentVariable("YANDEX_DISK_USERNAME", "test-user");
        Environment.SetEnvironmentVariable("YANDEX_DISK_PASSWORD", "test-password");

        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IWebDavService));
            if (descriptor is not null)
            {
                services.Remove(descriptor);
            }

            services.AddSingleton<IWebDavService, FakeWebDavService>();
        });
    }
}
