using System.Net;
using System.Net.Http.Json;

namespace ApiTests;

public class SocialApiTests : IClassFixture<GuitarNotepadWebApplicationFactory>
{
    private readonly GuitarNotepadWebApplicationFactory _factory;

    public SocialApiTests(GuitarNotepadWebApplicationFactory factory) =>
        _factory = factory;

    [Fact]
    public async Task T11_Api_FavoriteSong_AddAndRemove()
    {
        var ownerClient = ApiTestHelpers.CreateClient(_factory);
        var ownerToken = await ApiTestHelpers.RegisterAndLoginAsync(ownerClient);
        var songId = await ApiTestHelpers.CreateSongAsync(ownerClient, ownerToken, isPublic: true);

        var fanClient = ApiTestHelpers.CreateClient(_factory);
        var fanToken = await ApiTestHelpers.RegisterAndLoginAsync(fanClient);
        ApiTestHelpers.SetBearer(fanClient, fanToken);

        var add = await fanClient.PostAsync($"/api/albums/favorite/{songId}", null);
        Assert.True(add.IsSuccessStatusCode);

        var remove = await fanClient.DeleteAsync($"/api/albums/favorite/{songId}");
        Assert.True(remove.IsSuccessStatusCode);
    }

    [Fact]
    public async Task T12_Api_CreateSongReview_ReturnsCreated()
    {
        var ownerClient = ApiTestHelpers.CreateClient(_factory);
        var ownerToken = await ApiTestHelpers.RegisterAndLoginAsync(ownerClient);
        var songId = await ApiTestHelpers.CreateSongAsync(ownerClient, ownerToken, isPublic: true);

        var reviewerClient = ApiTestHelpers.CreateClient(_factory);
        var reviewerToken = await ApiTestHelpers.RegisterAndLoginAsync(reviewerClient);
        ApiTestHelpers.SetBearer(reviewerClient, reviewerToken);

        var response = await reviewerClient.PostAsJsonAsync($"/api/reviews/songs/{songId}", new
        {
            reviewText = "Excellent arrangement for practice.",
            beautifulLevel = 5,
            difficultyLevel = 3,
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task T14_Api_SubscribeAndUnsubscribeAlbum()
    {
        var publisherClient = ApiTestHelpers.CreateClient(_factory);
        var publisherToken = await ApiTestHelpers.RegisterAndLoginAsync(publisherClient);
        await ApiTestHelpers.UpgradeToPremiumAsync(publisherClient, publisherToken);
        var albumId = await ApiTestHelpers.CreateAlbumAsync(publisherClient, publisherToken);

        var subscriberClient = ApiTestHelpers.CreateClient(_factory);
        var subscriberToken = await ApiTestHelpers.RegisterAndLoginAsync(subscriberClient);
        ApiTestHelpers.SetBearer(subscriberClient, subscriberToken);

        var subscribe = await subscriberClient.PostAsync($"/api/subscriptions/{albumId}", null);
        Assert.Equal(HttpStatusCode.OK, subscribe.StatusCode);

        var list = await subscriberClient.GetAsync("/api/subscriptions");
        Assert.Equal(HttpStatusCode.OK, list.StatusCode);

        var unsubscribe = await subscriberClient.DeleteAsync($"/api/subscriptions/{albumId}");
        Assert.True(unsubscribe.IsSuccessStatusCode);
    }
}
