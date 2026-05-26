using Domain.Interfaces.Services;

namespace ApiTests;

internal sealed class FakeWebDavService : IWebDavService
{
    private static readonly byte[] EmptyBytes = [];

    public Task<string> UploadAvatarAsync(Stream fileStream, string fileName, Guid userId) =>
        Task.FromResult(fileName);

    public Task<string> GetAvatarUrlAsync(string fileName, string? scheme = null, string? host = null) =>
        Task.FromResult($"https://test.local/avatar/{fileName}");

    public Task<bool> DeleteAvatarAsync(string fileName) => Task.FromResult(true);

    public Task<string> GetRandomDefaultAvatarAsync(string? scheme = null, string? host = null) =>
        Task.FromResult("default.png");

    public Task<bool> AvatarExistsAsync(string fileName) => Task.FromResult(true);

    public Task<Stream> GetAvatarStreamAsync(string fileName) =>
        Task.FromResult<Stream>(new MemoryStream(EmptyBytes));

    public Task<byte[]> GetAvatarBytesAsync(string fileName) => Task.FromResult(EmptyBytes);

    public Task<bool> TestConnectionAsync() => Task.FromResult(true);

    public Task<string> UploadAudioAsync(Stream fileStream, string fileName, Guid songId) =>
        Task.FromResult(fileName);

    public Task<string> GetAudioUrlAsync(string fileName) =>
        Task.FromResult($"https://test.local/audio/{fileName}");

    public Task<bool> DeleteAudioAsync(string fileName) => Task.FromResult(true);

    public Task<bool> AudioExistsAsync(string fileName) => Task.FromResult(false);

    public Task<Stream> GetAudioStreamAsync(string fileName) =>
        Task.FromResult<Stream>(new MemoryStream(EmptyBytes));

    public Task<byte[]> GetAudioBytesAsync(string fileName) => Task.FromResult(EmptyBytes);

    public Task<string> UploadAlbumCoverAsync(string base64Content, Guid albumId) =>
        Task.FromResult($"cover-{albumId}.png");

    public Task<string> GetAlbumCoverUrlAsync(string fileName) =>
        Task.FromResult($"https://test.local/cover/{fileName}");

    public Task<bool> DeleteAlbumCoverAsync(string fileName) => Task.FromResult(true);

    public Task<bool> AlbumCoverExistsAsync(string fileName) => Task.FromResult(false);

    public Task<Stream> GetAlbumCoverStreamAsync(string fileName) =>
        Task.FromResult<Stream>(new MemoryStream(EmptyBytes));

    public Task<byte[]> GetAlbumCoverBytesAsync(string fileName) => Task.FromResult(EmptyBytes);
}
