using System.Net;
using System.Net.Http.Json;

namespace ApiTests;

public class AlbumsApiTests : IClassFixture<GuitarNotepadWebApplicationFactory>
{
    private readonly GuitarNotepadWebApplicationFactory _factory;

    public AlbumsApiTests(GuitarNotepadWebApplicationFactory factory) =>
        _factory = factory;

    [Fact]
    public async Task T22_Api_AlbumCrud_ReturnsExpectedStatusCodes()
    {
        var client = ApiTestHelpers.CreateClient(_factory);
        var token = await ApiTestHelpers.RegisterAndLoginAsync(client);
        await ApiTestHelpers.UpgradeToPremiumAsync(client, token);
        ApiTestHelpers.SetBearer(client, token);

        var create = await client.PostAsJsonAsync("/api/albums", new
        {
            title = $"Album_{Guid.NewGuid():N}"[..8],
            isPublic = true,
            genre = "Rock",
            theme = "Theme",
            description = "Album description",
        });
        Assert.True(create.IsSuccessStatusCode);

        var album = await create.Content.ReadFromJsonAsync<IdDto>(ApiTestHelpers.JsonOptions);
        var update = await client.PutAsJsonAsync($"/api/albums/{album!.Id}", new
        {
            title = "UpdatedAlbum",
            isPublic = true,
            genre = "Pop",
            theme = "Theme",
            description = "Updated",
        });
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var delete = await client.DeleteAsync($"/api/albums/{album.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
    }

    private sealed class IdDto
    {
        public Guid Id { get; set; }
    }
}
