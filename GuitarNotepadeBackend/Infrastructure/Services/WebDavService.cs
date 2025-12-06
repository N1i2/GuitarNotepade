using System.Net.Http.Headers;
using System.Text;
using Domain.Interfaces.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class WebDavService : IWebDavService
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly ILogger<WebDavService> _logger;
    private readonly string _baseUrl;
    private readonly string _username;
    private readonly string _password;
    private readonly string _avatarsFolder;
    private readonly List<string> _defaultAvatars = new()
    {
        "default_1.jpg"
    };

    public WebDavService(HttpClient httpClient, IMemoryCache cache, ILogger<WebDavService> logger)
    {
        _httpClient = httpClient;
        _cache = cache;
        _logger = logger;

        _username = Environment.GetEnvironmentVariable("YANDEX_DISK_USERNAME")
                   ?? throw new ArgumentNullException("YANDEX_DISK_USERNAME is not set");
        _password = Environment.GetEnvironmentVariable("YANDEX_DISK_PASSWORD")
                   ?? throw new ArgumentNullException("YANDEX_DISK_PASSWORD is not set");
        _baseUrl = Environment.GetEnvironmentVariable("YANDEX_DISK_BASE_URL") ?? "https://webdav.yandex.ru";
        _avatarsFolder = Environment.GetEnvironmentVariable("YANDEX_DISK_AVATARS_FOLDER") ?? "/GuitarNotepad";

        _logger.LogInformation("WebDavService initialized for user: {Username}", _username);
    }

    private HttpRequestMessage CreateAuthenticatedRequest(HttpMethod method, string requestUri)
    {
        var request = new HttpRequestMessage(method, requestUri);
        AddAuthenticationHeader(request);
        return request;
    }

    private void AddAuthenticationHeader(HttpRequestMessage request)
    {
        var authToken = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_username}:{_password}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authToken);
        request.Headers.Add("Depth", "0");
    }

    public async Task<string> UploadAvatarAsync(Stream fileStream, string fileName, Guid userId)
    {
        try
        {
            _logger.LogInformation("Uploading avatar for user {UserId}", userId);

            var fileExtension = Path.GetExtension(fileName).ToLowerInvariant();
            var uniqueFileName = $"{userId}_{Guid.NewGuid():N}{fileExtension}";
            var remotePath = $"{_avatarsFolder}/{uniqueFileName}";

            if (fileStream.CanSeek)
            {
                fileStream.Position = 0;
            }

            using var content = new StreamContent(fileStream);
            content.Headers.ContentType = new MediaTypeHeaderValue(GetMimeType(fileExtension));

            using var request = CreateAuthenticatedRequest(HttpMethod.Put, remotePath);
            request.Content = content;

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to upload avatar. Status: {StatusCode}, Error: {Error}",
                    response.StatusCode, errorContent);
                throw new Exception($"Failed to upload avatar: {response.StatusCode}");
            }

            _logger.LogInformation("Avatar uploaded successfully: {FileName}", uniqueFileName);

            return uniqueFileName;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading avatar for user {UserId}", userId);
            throw new Exception($"Error uploading avatar: {ex.Message}", ex);
        }
    }

    public async Task<string> GetAvatarUrlAsync(string fileName, string? scheme = null, string? host = null)
    {
        if (string.IsNullOrEmpty(fileName))
        {
            var defaultBytes = await GetAvatarBytesAsync(null!);
            return Convert.ToBase64String(defaultBytes);
        }

        if (Uri.IsWellFormedUriString(fileName, UriKind.Absolute))
        {
            return fileName;
        }

        var cacheKey = $"avatar_url_{fileName}";
        if (_cache.TryGetValue(cacheKey, out string? cachedUrl) && !string.IsNullOrEmpty(cachedUrl))
        {
            return cachedUrl;
        }

        var remotePath = $"{_avatarsFolder}/{fileName}";
        var exists = await FileExistsAsync(remotePath);

        if (!exists)
        {
            _logger.LogWarning("Avatar file not found: {FileName}, using default", fileName);
            var defaultBytes = await GetAvatarBytesAsync(null!);
            return Convert.ToBase64String(defaultBytes);
        }

        var bytes = await GetAvatarBytesAsync(fileName);
        var base64String = Convert.ToBase64String(bytes);

        _cache.Set(cacheKey, base64String, TimeSpan.FromHours(1));

        return base64String;
    }

    public async Task<bool> DeleteAvatarAsync(string fileName)
    {
        if (string.IsNullOrEmpty(fileName))
        {
            return false;
        }

        try
        {
            var remotePath = $"{_avatarsFolder}/{fileName}";

            if (!await FileExistsAsync(remotePath))
            {
                return true;
            }

            using var request = CreateAuthenticatedRequest(HttpMethod.Delete, remotePath);
            var response = await _httpClient.SendAsync(request);

            if (response.IsSuccessStatusCode)
            {
                _cache.Remove($"avatar_url_{fileName}");
                _logger.LogInformation("Avatar deleted: {FileName}", fileName);
                return true;
            }

            _logger.LogWarning("Failed to delete avatar: {FileName}, Status: {StatusCode}",
                fileName, response.StatusCode);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting avatar: {FileName}", fileName);
            return false;
        }
    }

    public async Task<string> GetRandomDefaultAvatarAsync(string? scheme = null, string? host = null)
    {
        await Task.CompletedTask;

        var random = new Random();
        var defaultAvatar = _defaultAvatars[random.Next(_defaultAvatars.Count)];

        return GenerateDefaultAvatarUrl(defaultAvatar, scheme, host);
    }

    public async Task<bool> AvatarExistsAsync(string fileName)
    {
        if (string.IsNullOrEmpty(fileName))
        {
            return false;
        }

        var remotePath = $"{_avatarsFolder}/{fileName}";
        return await FileExistsAsync(remotePath);
    }

    public async Task<Stream> GetAvatarStreamAsync(string fileName)
    {
        try
        {
            if (string.IsNullOrEmpty(fileName))
            {
                var random = new Random();
                var defaultAvatar = _defaultAvatars[random.Next(_defaultAvatars.Count)];
                fileName = defaultAvatar;
            }

            var remotePath = $"{_avatarsFolder}/{fileName}";

            _logger.LogDebug("Getting avatar stream: {RemotePath}", remotePath);

            using var request = CreateAuthenticatedRequest(HttpMethod.Get, remotePath);
            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var random = new Random();
                var defaultAvatar = _defaultAvatars[random.Next(_defaultAvatars.Count)];
                remotePath = $"{_avatarsFolder}/{defaultAvatar}";

                using var defaultRequest = CreateAuthenticatedRequest(HttpMethod.Get, remotePath);
                response = await _httpClient.SendAsync(defaultRequest);

                if (!response.IsSuccessStatusCode)
                {
                    throw new FileNotFoundException($"Avatar not found: {fileName}. Status: {response.StatusCode}");
                }
            }

            return await response.Content.ReadAsStreamAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting avatar stream: {FileName}", fileName);
            throw;
        }
    }

    public async Task<byte[]> GetAvatarBytesAsync(string fileName)
    {
        using var stream = await GetAvatarStreamAsync(fileName);
        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream);
        return memoryStream.ToArray();
    }

    private async Task<bool> FileExistsAsync(string remotePath)
    {
        try
        {
            using var request = CreateAuthenticatedRequest(new HttpMethod("PROPFIND"), remotePath);
            var response = await _httpClient.SendAsync(request);

            _logger.LogDebug("FileExists check for {Path}: {StatusCode}", remotePath, response.StatusCode);

            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "File existence check failed: {RemotePath}", remotePath);
            return false;
        }
    }

    private string GenerateAvatarUrl(string fileName, string? scheme = null, string? host = null)
    {
        if (!string.IsNullOrEmpty(scheme) && !string.IsNullOrEmpty(host))
        {
            return $"{scheme}://{host}/api/avatars/{fileName}";
        }

        return $"/api/avatars/{fileName}";
    }

    private string GenerateDefaultAvatarUrl(string fileName, string? scheme = null, string? host = null)
    {
        if (!string.IsNullOrEmpty(scheme) && !string.IsNullOrEmpty(host))
        {
            return $"{scheme}://{host}/api/avatars/default/{fileName}";
        }

        return $"/api/avatars/default/{fileName}";
    }

    private string GetMimeType(string fileExtension)
    {
        return fileExtension.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".svg" => "image/svg+xml",
            _ => "application/octet-stream"
        };
    }
    public async Task<bool> TestConnectionAsync()
    {
        try
        {
            using var request = CreateAuthenticatedRequest(new HttpMethod("PROPFIND"), _avatarsFolder);
            var response = await _httpClient.SendAsync(request);

            _logger.LogInformation("WebDAV connection test: {StatusCode}", response.StatusCode);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("WebDAV directory listing: {Content}", content);
                return true;
            }
            else
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("WebDAV connection failed: {Error}", error);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "WebDAV connection test failed");
            return false;
        }
    }
}