using System.Net;
using System.Net.Http.Json;
using Domain.Common;

namespace ApiTests;

public class QuotaApiTests : IClassFixture<GuitarNotepadWebApplicationFactory>
{
    private readonly GuitarNotepadWebApplicationFactory _factory;

    public QuotaApiTests(GuitarNotepadWebApplicationFactory factory) =>
        _factory = factory;

    [Fact]
    public async Task T13_Api_CreateSong_ExceedsFreeQuota_ReturnsBadRequest()
    {
        var client = ApiTestHelpers.CreateClient(_factory);
        var token = await ApiTestHelpers.RegisterAndLoginAsync(client);
        ApiTestHelpers.SetBearer(client, token);

        for (var i = 0; i < Constants.Limits.FreeUserMaxSongs; i++)
        {
            await ApiTestHelpers.CreateSongAsync(client, token, title: $"QuotaSong_{i}");
        }

        var overflow = await client.PostAsJsonAsync("/api/songs", new
        {
            title = "OverflowSong",
            genre = "Rock",
            theme = "Theme",
            artist = "Artist",
            isPublic = true,
        });

        Assert.Equal(HttpStatusCode.BadRequest, overflow.StatusCode);
        var body = await overflow.Content.ReadAsStringAsync();
        Assert.Contains("Free users", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task T21_Api_PremiumUser_CreatesBeyondFreeSongQuota()
    {
        var client = ApiTestHelpers.CreateClient(_factory);
        var token = await ApiTestHelpers.RegisterAndLoginAsync(client);
        await ApiTestHelpers.UpgradeToPremiumAsync(client, token);
        ApiTestHelpers.SetBearer(client, token);

        for (var i = 0; i < Constants.Limits.FreeUserMaxSongs + 1; i++)
        {
            var response = await client.PostAsJsonAsync("/api/songs", new
            {
                title = $"PremiumSong_{i}",
                genre = "Rock",
                theme = "Theme",
                artist = "Artist",
                isPublic = true,
            });
            Assert.True(
                response.IsSuccessStatusCode,
                await response.Content.ReadAsStringAsync());
        }
    }
}
