using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ApiTests;

internal sealed record AuthContext(
    HttpClient Client,
    string Email,
    string Token,
    Guid UserId);

internal static class ApiTestHelpers
{
    internal const string DefaultPassword = "Test123!";

    internal static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    internal static HttpClient CreateClient(GuitarNotepadWebApplicationFactory factory) =>
        factory.CreateClient();

    internal static void SetBearer(HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);
    }

    internal static void ClearBearer(HttpClient client) =>
        client.DefaultRequestHeaders.Authorization = null;

    internal static async Task<AuthContext> RegisterAsync(
        HttpClient client,
        string? suffix = null)
    {
        var id = suffix ?? Guid.NewGuid().ToString("N")[..8];
        var email = $"apitest_{id}@test.com";
        var body = new
        {
            email,
            nikName = $"user_{id}",
            password = DefaultPassword,
            confirmPassword = DefaultPassword,
        };

        var response = await client.PostAsJsonAsync("/api/auth/register", body);
        await EnsureSuccessAsync(response, "register");

        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        return new AuthContext(client, email, auth!.Token, auth.UserId);
    }

    internal static async Task<string> LoginAsync(
        HttpClient client,
        string email,
        string password = DefaultPassword)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        await EnsureSuccessAsync(response, "login");
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        return auth!.Token;
    }

    internal static async Task<string> RegisterAndLoginAsync(
        HttpClient client,
        string? suffix = null)
    {
        var ctx = await RegisterAsync(client, suffix);
        return ctx.Token;
    }

    internal static async Task<AuthContext> RegisterAdminAsync(
        GuitarNotepadWebApplicationFactory factory,
        string? suffix = null)
    {
        var client = CreateClient(factory);
        var ctx = await RegisterAsync(client, suffix);
        await PromoteToAdminAsync(factory, ctx.Email);
        var adminToken = await LoginAsync(client, ctx.Email);
        SetBearer(client, adminToken);
        return ctx with { Token = adminToken };
    }

    internal static async Task PromoteToAdminAsync(
        GuitarNotepadWebApplicationFactory factory,
        string email)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await db.Users.FirstAsync(u => u.Email == email);
        user.MakeAdminRole();
        await db.SaveChangesAsync();
    }

    internal static async Task UpgradeToPremiumAsync(HttpClient client, string token)
    {
        SetBearer(client, token);
        var response = await client.PostAsJsonAsync("/api/payments/upgrade-to-premium", new
        {
            paymentMethod = "card",
            paymentToken = "test_token",
        });
        await EnsureSuccessAsync(response, "upgrade-to-premium");
    }

    internal static async Task<Guid> CreateSongAsync(
        HttpClient client,
        string token,
        bool isPublic = true,
        string? title = null)
    {
        SetBearer(client, token);
        var response = await client.PostAsJsonAsync("/api/songs", new
        {
            title = title ?? $"Song_{Guid.NewGuid():N}"[..8],
            genre = "Rock",
            theme = "Theme",
            artist = "Artist",
            isPublic,
        });
        await EnsureSuccessAsync(response, "create song");
        var song = await response.Content.ReadFromJsonAsync<EntityIdResponse>(JsonOptions);
        return song!.Id;
    }

    internal static async Task<Guid> CreateChordAsync(HttpClient client, string token)
    {
        SetBearer(client, token);
        var response = await client.PostAsJsonAsync("/api/chords", new
        {
            name = $"C_{Guid.NewGuid():N}"[..6],
            fingering = "x-3-2-0-1-0",
            description = "Test",
        });
        await EnsureSuccessAsync(response, "create chord");
        var chord = await response.Content.ReadFromJsonAsync<EntityIdResponse>(JsonOptions);
        return chord!.Id;
    }

    internal static async Task<Guid> CreatePatternAsync(HttpClient client, string token)
    {
        SetBearer(client, token);
        var response = await client.PostAsJsonAsync("/api/strummingpatterns", new
        {
            name = $"P_{Guid.NewGuid():N}"[..6],
            pattern = "D D U U D U",
            isFingerStyle = false,
            description = "Test pattern",
        });
        await EnsureSuccessAsync(response, "create pattern");
        var pattern = await response.Content.ReadFromJsonAsync<EntityIdResponse>(JsonOptions);
        return pattern!.Id;
    }

    internal static async Task<Guid> CreateAlbumAsync(HttpClient client, string token)
    {
        SetBearer(client, token);
        var response = await client.PostAsJsonAsync("/api/albums", new
        {
            title = $"Album_{Guid.NewGuid():N}"[..8],
            isPublic = true,
            genre = "Rock",
            theme = "Live",
            description = "Test album",
        });
        await EnsureSuccessAsync(response, "create album");
        var album = await response.Content.ReadFromJsonAsync<EntityIdResponse>(JsonOptions);
        return album!.Id;
    }

    internal static async Task EnsureSuccessAsync(
        HttpResponseMessage response,
        string operation)
    {
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var body = await response.Content.ReadAsStringAsync();
        throw new InvalidOperationException(
            $"{operation} failed ({(int)response.StatusCode}): {body}");
    }

    private sealed class AuthResponse
    {
        public Guid UserId { get; set; }
        public string Token { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    private sealed class EntityIdResponse
    {
        public Guid Id { get; set; }
    }
}
