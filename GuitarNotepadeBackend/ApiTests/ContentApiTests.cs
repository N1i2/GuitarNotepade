using System.Net;
using System.Net.Http.Json;

namespace ApiTests;

public class ContentApiTests : IClassFixture<GuitarNotepadWebApplicationFactory>
{
    private readonly GuitarNotepadWebApplicationFactory _factory;

    public ContentApiTests(GuitarNotepadWebApplicationFactory factory) =>
        _factory = factory;

    [Fact]
    public async Task T15_Api_ChordCrud_ReturnsExpectedStatusCodes()
    {
        var client = ApiTestHelpers.CreateClient(_factory);
        var token = await ApiTestHelpers.RegisterAndLoginAsync(client);
        ApiTestHelpers.SetBearer(client, token);

        var create = await client.PostAsJsonAsync("/api/chords", new
        {
            name = $"Am_{Guid.NewGuid():N}"[..6],
            fingering = "x-0-2-2-1-0",
            description = "Test chord",
        });
        Assert.True(create.IsSuccessStatusCode);

        var chord = await create.Content.ReadFromJsonAsync<IdDto>(ApiTestHelpers.JsonOptions);
        var update = await client.PutAsJsonAsync($"/api/chords/{chord!.Id}", new
        {
            name = $"Bm_{Guid.NewGuid():N}"[..6],
            fingering = "x-2-4-4-3-2",
            description = "Updated",
        });
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var delete = await client.DeleteAsync($"/api/chords/{chord.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
    }

    [Fact]
    public async Task T16_Api_PatternCrud_ReturnsExpectedStatusCodes()
    {
        var client = ApiTestHelpers.CreateClient(_factory);
        var token = await ApiTestHelpers.RegisterAndLoginAsync(client);
        ApiTestHelpers.SetBearer(client, token);

        var create = await client.PostAsJsonAsync("/api/strummingpatterns", new
        {
            name = $"Pat_{Guid.NewGuid():N}"[..6],
            pattern = "D D U U D U",
            isFingerStyle = false,
            description = "Pattern",
        });
        Assert.True(create.IsSuccessStatusCode);

        var pattern = await create.Content.ReadFromJsonAsync<IdDto>(ApiTestHelpers.JsonOptions);
        var update = await client.PutAsJsonAsync($"/api/strummingpatterns/{pattern!.Id}", new
        {
            name = $"PatU_{Guid.NewGuid():N}"[..6],
            pattern = "D U D U",
            isFingerStyle = false,
            description = "Updated",
        });
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var delete = await client.DeleteAsync($"/api/strummingpatterns/{pattern.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
    }

    [Fact]
    public async Task T17_Api_SongCrudAndStructure_ReturnsExpectedStatusCodes()
    {
        var client = ApiTestHelpers.CreateClient(_factory);
        var token = await ApiTestHelpers.RegisterAndLoginAsync(client);
        var songId = await ApiTestHelpers.CreateSongAsync(client, token);

        ApiTestHelpers.SetBearer(client, token);
        var structure = await client.PostAsJsonAsync($"/api/songs/{songId}/structure", new
        {
            segments = new[]
            {
                new
                {
                    id = Guid.NewGuid(),
                    type = "Text",
                    lyric = "Line one",
                },
            },
        });
        Assert.True(
            structure.IsSuccessStatusCode,
            await structure.Content.ReadAsStringAsync());

        var update = await client.PutAsJsonAsync($"/api/songs/{songId}", new
        {
            title = "UpdatedTitle",
            genre = "Rock",
            theme = "Theme",
            artist = "Artist",
            isPublic = true,
        });
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var delete = await client.DeleteAsync($"/api/songs/{songId}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
    }

    [Fact]
    public async Task T18_Api_SongCustomAudioUrl_CanBeSetAndRead()
    {
        var client = ApiTestHelpers.CreateClient(_factory);
        var token = await ApiTestHelpers.RegisterAndLoginAsync(client);
        var songId = await ApiTestHelpers.CreateSongAsync(client, token);

        ApiTestHelpers.SetBearer(client, token);
        var update = await client.PutAsJsonAsync($"/api/songs/{songId}", new
        {
            title = "AudioSong",
            genre = "Rock",
            theme = "Theme",
            artist = "Artist",
            isPublic = true,
            customAudioUrl = "test-audio/track.mp3",
            customAudioType = "audio/mpeg",
        });
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var get = await client.GetAsync($"/api/songs/{songId}");
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);
        var body = await get.Content.ReadAsStringAsync();
        Assert.Contains("test-audio/track.mp3", body);
    }

    [Fact]
    public async Task T19_Api_UpgradeToPremium_ReturnsSuccess()
    {
        var client = ApiTestHelpers.CreateClient(_factory);
        var token = await ApiTestHelpers.RegisterAndLoginAsync(client);
        ApiTestHelpers.SetBearer(client, token);

        var response = await client.PostAsJsonAsync("/api/payments/upgrade-to-premium", new
        {
            paymentMethod = "card",
            paymentToken = "test_token",
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private sealed class IdDto
    {
        public Guid Id { get; set; }
    }
}
