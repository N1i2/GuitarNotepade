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
}