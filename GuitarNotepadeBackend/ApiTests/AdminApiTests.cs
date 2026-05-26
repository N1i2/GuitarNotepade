using System.Net;
using System.Net.Http.Json;

namespace ApiTests;

public class AdminApiTests : IClassFixture<GuitarNotepadWebApplicationFactory>
{
    private readonly GuitarNotepadWebApplicationFactory _factory;

    public AdminApiTests(GuitarNotepadWebApplicationFactory factory) =>
        _factory = factory;

    [Fact]
    public async Task T24_Api_ToggleUserRole_PromotesUserToAdmin()
    {
        var targetClient = ApiTestHelpers.CreateClient(_factory);
        var target = await ApiTestHelpers.RegisterAsync(targetClient);

        var admin = await ApiTestHelpers.RegisterAdminAsync(_factory);
        var response = await admin.Client.PutAsJsonAsync(
            "/api/usermanagement/toggle-user-role",
            new { email = target.Email });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task T25_Api_BlockUser_PreventsLogin()
    {
        var targetClient = ApiTestHelpers.CreateClient(_factory);
        var target = await ApiTestHelpers.RegisterAsync(targetClient);

        var admin = await ApiTestHelpers.RegisterAdminAsync(_factory);
        var block = await admin.Client.PutAsJsonAsync("/api/usermanagement/block-user", new
        {
            email = target.Email,
            reason = "Test block",
            blockedUntil = DateTime.UtcNow.AddDays(3),
        });
        Assert.Equal(HttpStatusCode.OK, block.StatusCode);

        var login = await targetClient.PostAsJsonAsync("/api/auth/login", new
        {
            email = target.Email,
            password = ApiTestHelpers.DefaultPassword,
        });
        Assert.Equal(HttpStatusCode.BadRequest, login.StatusCode);
    }

    [Fact]
    public async Task T26_Api_AdminCanGetPrivateSong()
    {
        var ownerClient = ApiTestHelpers.CreateClient(_factory);
        var ownerToken = await ApiTestHelpers.RegisterAndLoginAsync(ownerClient);
        var songId = await ApiTestHelpers.CreateSongAsync(ownerClient, ownerToken, isPublic: false);

        var admin = await ApiTestHelpers.RegisterAdminAsync(_factory);
        var response = await admin.Client.GetAsync($"/api/songs/{songId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task T27_Api_AdminCanDeleteForeignSong()
    {
        var ownerClient = ApiTestHelpers.CreateClient(_factory);
        var ownerToken = await ApiTestHelpers.RegisterAndLoginAsync(ownerClient);
        var songId = await ApiTestHelpers.CreateSongAsync(ownerClient, ownerToken);

        var admin = await ApiTestHelpers.RegisterAdminAsync(_factory);
        var delete = await admin.Client.DeleteAsync($"/api/songs/{songId}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);

        var get = await admin.Client.GetAsync($"/api/songs/{songId}");
        Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
    }
}
