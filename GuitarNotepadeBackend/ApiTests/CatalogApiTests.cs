using System.Net;
using System.Net.Http.Json;

namespace ApiTests;

public class CatalogApiTests : IClassFixture<GuitarNotepadWebApplicationFactory>
{
    private readonly GuitarNotepadWebApplicationFactory _factory;

    public CatalogApiTests(GuitarNotepadWebApplicationFactory factory) =>
        _factory = factory;

    [Fact]
    public async Task T02_Api_GetPublicSongs_ReturnsOk()
    {
        var client = ApiTestHelpers.CreateClient(_factory);
        var response = await client.GetAsync("/api/songs?page=1&pageSize=10");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task T03_Api_GetChords_ReturnsOk()
    {
        var client = ApiTestHelpers.CreateClient(_factory);
        var response = await client.GetAsync("/api/chords?page=1&pageSize=10");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task T04_Api_GetPatterns_ReturnsOk()
    {
        var client = ApiTestHelpers.CreateClient(_factory);
        var response = await client.GetAsync("/api/strummingpatterns?page=1&pageSize=10");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task T05_Api_SearchSongs_WithFilters_ReturnsOk()
    {
        var client = ApiTestHelpers.CreateClient(_factory);
        var token = await ApiTestHelpers.RegisterAndLoginAsync(client);
        ApiTestHelpers.SetBearer(client, token);
        await ApiTestHelpers.CreateSongAsync(client, token, title: "UniqueFilterSong");

        var response = await client.GetAsync(
            "/api/songs?searchTerm=UniqueFilter&sortBy=title&sortOrder=asc&page=1&pageSize=10");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task T06_Api_GetProfile_ReturnsCurrentUser()
    {
        var client = ApiTestHelpers.CreateClient(_factory);
        var ctx = await ApiTestHelpers.RegisterAsync(client);
        ApiTestHelpers.SetBearer(client, ctx.Token);

        var response = await client.GetAsync("/api/user/profile");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains(ctx.Email, body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task T07_Api_GetMyPatterns_ReturnsOk()
    {
        var client = ApiTestHelpers.CreateClient(_factory);
        var token = await ApiTestHelpers.RegisterAndLoginAsync(client);
        ApiTestHelpers.SetBearer(client, token);
        await ApiTestHelpers.CreatePatternAsync(client, token);

        var response = await client.GetAsync("/api/strummingpatterns/my-patterns?page=1&pageSize=10");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task T08_Api_GetMyChords_ReturnsOk()
    {
        var client = ApiTestHelpers.CreateClient(_factory);
        var token = await ApiTestHelpers.RegisterAndLoginAsync(client);
        ApiTestHelpers.SetBearer(client, token);
        await ApiTestHelpers.CreateChordAsync(client, token);

        var response = await client.GetAsync("/api/chords/my-chords?page=1&pageSize=10");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task T09_Api_GetMySongs_ReturnsOkWhenAuthenticated()
    {
        var client = ApiTestHelpers.CreateClient(_factory);
        var token = await ApiTestHelpers.RegisterAndLoginAsync(client);
        ApiTestHelpers.SetBearer(client, token);

        var response = await client.GetAsync("/api/songs/my-songs?includePrivate=true&page=1&pageSize=10");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task T10_Api_GetMyAlbums_ReturnsOkForPremiumUser()
    {
        var client = ApiTestHelpers.CreateClient(_factory);
        var token = await ApiTestHelpers.RegisterAndLoginAsync(client);
        await ApiTestHelpers.UpgradeToPremiumAsync(client, token);
        await ApiTestHelpers.CreateAlbumAsync(client, token);

        ApiTestHelpers.SetBearer(client, token);
        var response = await client.GetAsync("/api/albums/my-albums?page=1&pageSize=10");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
