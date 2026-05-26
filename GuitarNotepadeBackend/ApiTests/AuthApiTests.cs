using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace ApiTests;

public class AuthApiTests : IClassFixture<GuitarNotepadWebApplicationFactory>
{
    private readonly GuitarNotepadWebApplicationFactory _factory;

    public AuthApiTests(GuitarNotepadWebApplicationFactory factory) =>
        _factory = factory;

    [Fact]
    public async Task T01_Api_Register_ReturnsToken()
    {
        var client = ApiTestHelpers.CreateClient(_factory);
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = $"reg_{suffix}@test.com",
            nikName = $"nick_{suffix}",
            password = ApiTestHelpers.DefaultPassword,
            confirmPassword = ApiTestHelpers.DefaultPassword,
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        Assert.Contains("token", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task T20_Api_NonAdminAuth_RejectsInvalidLoginAndAdminEndpoints()
    {
        var client = ApiTestHelpers.CreateClient(_factory);
        var ctx = await ApiTestHelpers.RegisterAsync(client);

        var badLogin = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = ctx.Email,
            password = "WrongPass1!",
        });
        Assert.Equal(HttpStatusCode.BadRequest, badLogin.StatusCode);

        ApiTestHelpers.SetBearer(client, ctx.Token);
        var adminOnly = await client.PutAsJsonAsync(
            "/api/usermanagement/toggle-user-role",
            new { email = "nobody@test.com" });
        Assert.Equal(HttpStatusCode.Forbidden, adminOnly.StatusCode);
    }

    [Fact]
    public async Task T23_Api_AdminLogin_ReturnsAdminRole()
    {
        var admin = await ApiTestHelpers.RegisterAdminAsync(_factory);

        var response = await admin.Client.PostAsJsonAsync("/api/auth/login", new
        {
            email = admin.Email,
            password = ApiTestHelpers.DefaultPassword,
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("Admin", doc.RootElement.GetProperty("role").GetString());
    }
}
