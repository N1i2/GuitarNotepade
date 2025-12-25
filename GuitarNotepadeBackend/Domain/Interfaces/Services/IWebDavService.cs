namespace Domain.Interfaces.Services;

public interface IWebDavService
{
    Task<string> UploadAvatarAsync(Stream fileStream, string fileName, Guid userId);
    Task<string> GetAvatarUrlAsync(string fileName, string? scheme = null, string? host = null);
    Task<bool> DeleteAvatarAsync(string fileName);
    Task<string> GetRandomDefaultAvatarAsync(string? scheme = null, string? host = null);
    Task<bool> AvatarExistsAsync(string fileName);
    Task<Stream> GetAvatarStreamAsync(string fileName);
    Task<byte[]> GetAvatarBytesAsync(string fileName);
    Task<bool> TestConnectionAsync();

    Task<string> UploadAudioAsync(Stream fileStream, string fileName, Guid songId);
    Task<string> GetAudioUrlAsync(string fileName);
    Task<bool> DeleteAudioAsync(string fileName);
    Task<bool> AudioExistsAsync(string fileName);
    Task<Stream> GetAudioStreamAsync(string fileName);
    Task<byte[]> GetAudioBytesAsync(string fileName);

    Task<string> UploadAlbumCoverAsync(string base64Content, Guid albumId);
    Task<string> GetAlbumCoverUrlAsync(string fileName);
    Task<bool> DeleteAlbumCoverAsync(string fileName);
    Task<bool> AlbumCoverExistsAsync(string fileName);
    Task<Stream> GetAlbumCoverStreamAsync(string fileName);
    Task<byte[]> GetAlbumCoverBytesAsync(string fileName);
}