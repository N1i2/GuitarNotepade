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
    private readonly string _audioFolder;
    private readonly string _albumCoversFolder;

    private readonly List<string> _defaultAvatars = new()
    {
        "default_1.jpg"
    };

    private readonly HashSet<string> _supportedAudioExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".opus"
    };

    private readonly HashSet<string> _supportedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"
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
        _avatarsFolder = Environment.GetEnvironmentVariable("YANDEX_DISK_AVATARS_FOLDER") ?? "/GuitarNotepad/Avatars";
        _audioFolder = Environment.GetEnvironmentVariable("YANDEX_DISK_AUDIO_FOLDER") ?? "/GuitarNotepad/Audio";
        _albumCoversFolder = Environment.GetEnvironmentVariable("YANDEX_DISK_ALBUM_COVERS_FOLDER") ?? "/GuitarNotepad/AlbumCovers";

        _logger.LogInformation("WebDavService initialized for user: {Username}", _username);
    }

    private HttpRequestMessage CreateAuthenticatedRequest(HttpMethod method, string requestUri)
    {
        var request = new HttpRequestMessage(method, $"{_baseUrl}{requestUri}");
        AddAuthenticationHeader(request);
        return request;
    }

    private void AddAuthenticationHeader(HttpRequestMessage request)
    {
        var authToken = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_username}:{_password}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authToken);
        request.Headers.Add("Depth", "0");
    }

    #region Album Covers Methods

    public async Task<string> UploadAlbumCoverAsync(string base64Content, Guid albumId)
    {
        try
        {
            _logger.LogInformation("Uploading album cover for album {AlbumId}", albumId);

            if (!base64Content.StartsWith("data:image/"))
            {
                throw new ArgumentException("Invalid image format. Must start with 'data:image/'");
            }

            var cleanBase64 = CleanBase64String(base64Content);
            var mimeType = GetMimeTypeFromBase64(base64Content);
            var fileExtension = GetFileExtensionFromMimeType(mimeType);

            if (!_supportedImageExtensions.Contains(fileExtension.ToLowerInvariant()))
            {
                throw new ArgumentException($"Unsupported image format: {fileExtension}. Supported formats: {string.Join(", ", _supportedImageExtensions)}");
            }

            var fileName = $"{albumId}{fileExtension}";
            var remotePath = $"{_albumCoversFolder}/{fileName}";

            await EnsureAlbumCoversFolderExists();

            var bytes = Convert.FromBase64String(cleanBase64);
            using var stream = new MemoryStream(bytes);

            using var content = new StreamContent(stream);
            content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);

            using var request = CreateAuthenticatedRequest(HttpMethod.Put, remotePath);
            request.Content = content;

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to upload album cover. Status: {StatusCode}, Error: {Error}",
                    response.StatusCode, errorContent);
                throw new Exception($"Failed to upload album cover: {response.StatusCode}");
            }

            _logger.LogInformation("Album cover uploaded successfully: {FileName} for album {AlbumId}",
                fileName, albumId);

            return fileName;
        }
        catch (FormatException ex)
        {
            _logger.LogError(ex, "Invalid base64 format for album cover");
            throw new ArgumentException("Invalid base64 image format", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading album cover for album {AlbumId}", albumId);
            throw;
        }
    }

    public async Task<bool> DeleteAlbumCoverAsync(string fileName)
    {
        if (string.IsNullOrEmpty(fileName))
        {
            return false;
        }

        try
        {
            var remotePath = $"{_albumCoversFolder}/{fileName}";

            if (!await AlbumCoverExistsAsync(fileName))
            {
                _logger.LogInformation("Album cover already deleted or doesn't exist: {FileName}", fileName);
                return true;
            }

            using var request = CreateAuthenticatedRequest(HttpMethod.Delete, remotePath);
            var response = await _httpClient.SendAsync(request);

            if (response.IsSuccessStatusCode)
            {
                _cache.Remove($"album_cover_url_{fileName}");
                _logger.LogInformation("Album cover deleted: {FileName}", fileName);
                return true;
            }

            _logger.LogWarning("Failed to delete album cover: {FileName}, Status: {StatusCode}",
                fileName, response.StatusCode);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting album cover: {FileName}", fileName);
            return false;
        }
    }

    public async Task<bool> AlbumCoverExistsAsync(string fileName)
    {
        if (string.IsNullOrEmpty(fileName))
        {
            return false;
        }

        var remotePath = $"{_albumCoversFolder}/{fileName}";
        return await FileExistsAsync(remotePath);
    }

    public async Task<Stream> GetAlbumCoverStreamAsync(string fileName)
    {
        try
        {
            if (string.IsNullOrEmpty(fileName))
            {
                throw new ArgumentException("File name cannot be null or empty", nameof(fileName));
            }

            var remotePath = $"{_albumCoversFolder}/{fileName}";

            _logger.LogDebug("Getting album cover stream: {RemotePath}", remotePath);

            using var request = CreateAuthenticatedRequest(HttpMethod.Get, remotePath);
            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to get album cover stream. Status: {StatusCode}, Error: {Error}",
                    response.StatusCode, errorContent);

                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    throw new FileNotFoundException($"Album cover file not found: {fileName}");
                }

                throw new Exception($"Failed to get album cover: {response.StatusCode}");
            }

            return await response.Content.ReadAsStreamAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting album cover stream: {FileName}", fileName);
            throw;
        }
    }

    public async Task<byte[]> GetAlbumCoverBytesAsync(string fileName)
    {
        if (string.IsNullOrEmpty(fileName))
        {
            return Array.Empty<byte>();
        }

        try
        {
            using var stream = await GetAlbumCoverStreamAsync(fileName);
            using var memoryStream = new MemoryStream();
            await stream.CopyToAsync(memoryStream);
            return memoryStream.ToArray();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting album cover bytes: {FileName}", fileName);
            return Array.Empty<byte>();
        }
    }

    #endregion

    #region Helper Methods

    private string CleanBase64String(string base64)
    {
        if (base64.Contains("data:") && base64.Contains("base64,"))
        {
            var parts = base64.Split(',');
            if (parts.Length == 2)
            {
                return parts[1];
            }
        }
        return base64;
    }

    private string GetMimeTypeFromBase64(string base64)
    {
        if (base64.StartsWith("data:"))
        {
            var mimeEnd = base64.IndexOf(';');
            if (mimeEnd > 0)
            {
                return base64.Substring(5, mimeEnd - 5);
            }
        }
        return "image/jpeg";
    }

    private string GetFileExtensionFromMimeType(string mimeType)
    {
        return mimeType.ToLowerInvariant() switch
        {
            "image/jpeg" or "image/jpg" => ".jpg",
            "image/png" => ".png",
            "image/gif" => ".gif",
            "image/webp" => ".webp",
            "image/bmp" => ".bmp",
            _ => ".jpg"
        };
    }

    private async Task EnsureAlbumCoversFolderExists()
    {
        try
        {
            using var request = CreateAuthenticatedRequest(new HttpMethod("PROPFIND"), _albumCoversFolder);
            var response = await _httpClient.SendAsync(request);

            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                using var mkcolRequest = CreateAuthenticatedRequest(new HttpMethod("MKCOL"), _albumCoversFolder);
                var mkcolResponse = await _httpClient.SendAsync(mkcolRequest);

                if (!mkcolResponse.IsSuccessStatusCode)
                {
                    var errorContent = await mkcolResponse.Content.ReadAsStringAsync();
                    _logger.LogError("Failed to create album covers folder. Status: {StatusCode}, Error: {Error}",
                        mkcolResponse.StatusCode, errorContent);
                    throw new Exception($"Failed to create album covers folder: {mkcolResponse.StatusCode}");
                }

                _logger.LogInformation("Album covers folder created: {Folder}", _albumCoversFolder);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ensuring album covers folder exists");
            throw;
        }
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

    #endregion

    #region Audio Methods (остаются как есть с исправлениями)

    public async Task<string> UploadAudioAsync(Stream fileStream, string fileName, Guid songId)
    {
        try
        {
            _logger.LogInformation("Uploading audio for song {SongId}", songId);

            var fileExtension = Path.GetExtension(fileName).ToLowerInvariant();
            if (!_supportedAudioExtensions.Contains(fileExtension))
            {
                throw new ArgumentException($"Unsupported audio format: {fileExtension}. Supported formats: {string.Join(", ", _supportedAudioExtensions)}");
            }

            var uniqueFileName = $"{songId}_{Guid.NewGuid():N}{fileExtension}";
            var remotePath = $"{_audioFolder}/{uniqueFileName}";

            await EnsureAudioFolderExists();

            if (fileStream.CanSeek)
            {
                fileStream.Position = 0;
            }

            using var content = new StreamContent(fileStream);
            content.Headers.ContentType = new MediaTypeHeaderValue(GetAudioMimeType(fileExtension));

            using var request = CreateAuthenticatedRequest(HttpMethod.Put, remotePath);
            request.Content = content;

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to upload audio. Status: {StatusCode}, Error: {Error}",
                    response.StatusCode, errorContent);
                throw new Exception($"Failed to upload audio: {response.StatusCode}");
            }

            _logger.LogInformation("Audio uploaded successfully: {FileName} for song {SongId}",
                uniqueFileName, songId);

            return uniqueFileName;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading audio for song {SongId}", songId);
            throw new Exception($"Error uploading audio: {ex.Message}", ex);
        }
    }

    public async Task<string> GetAudioUrlAsync(string fileName)
    {
        if (string.IsNullOrEmpty(fileName))
        {
            return string.Empty;
        }

        if (Uri.IsWellFormedUriString(fileName, UriKind.Absolute))
        {
            return fileName;
        }

        var cacheKey = $"audio_url_{fileName}";
        if (_cache.TryGetValue(cacheKey, out string? cachedUrl) && !string.IsNullOrEmpty(cachedUrl))
        {
            return cachedUrl;
        }

        var exists = await AudioExistsAsync(fileName);
        if (!exists)
        {
            _logger.LogWarning("Audio file not found: {FileName}", fileName);
            return string.Empty;
        }

        try
        {
            var bytes = await GetAudioBytesAsync(fileName);
            if (bytes == null || bytes.Length == 0)
            {
                return string.Empty;
            }

            var mimeType = GetAudioMimeType(Path.GetExtension(fileName));
            var base64String = Convert.ToBase64String(bytes);
            var dataUrl = $"data:{mimeType};base64,{base64String}";

            _cache.Set(cacheKey, dataUrl, TimeSpan.FromHours(1));

            return dataUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audio URL for {FileName}", fileName);
            return string.Empty;
        }
    }

    public async Task<bool> DeleteAudioAsync(string fileName)
    {
        if (string.IsNullOrEmpty(fileName))
        {
            return false;
        }

        try
        {
            var remotePath = $"{_audioFolder}/{fileName}";

            if (!await AudioExistsAsync(fileName))
            {
                _logger.LogInformation("Audio file already deleted or doesn't exist: {FileName}", fileName);
                return true;
            }

            using var request = CreateAuthenticatedRequest(HttpMethod.Delete, remotePath);
            var response = await _httpClient.SendAsync(request);

            if (response.IsSuccessStatusCode)
            {
                _cache.Remove($"audio_url_{fileName}");
                _logger.LogInformation("Audio deleted: {FileName}", fileName);
                return true;
            }

            _logger.LogWarning("Failed to delete audio: {FileName}, Status: {StatusCode}",
                fileName, response.StatusCode);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting audio: {FileName}", fileName);
            return false;
        }
    }

    public async Task<bool> AudioExistsAsync(string fileName)
    {
        if (string.IsNullOrEmpty(fileName))
        {
            return false;
        }

        var remotePath = $"{_audioFolder}/{fileName}";
        return await FileExistsAsync(remotePath);
    }

    public async Task<Stream> GetAudioStreamAsync(string fileName)
    {
        try
        {
            if (string.IsNullOrEmpty(fileName))
            {
                throw new ArgumentException("File name cannot be null or empty", nameof(fileName));
            }

            var remotePath = $"{_audioFolder}/{fileName}";

            _logger.LogDebug("Getting audio stream: {RemotePath}", remotePath);

            using var request = CreateAuthenticatedRequest(HttpMethod.Get, remotePath);
            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to get audio stream. Status: {StatusCode}, Error: {Error}",
                    response.StatusCode, errorContent);

                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    throw new FileNotFoundException($"Audio file not found: {fileName}");
                }

                throw new Exception($"Failed to get audio: {response.StatusCode}");
            }

            return await response.Content.ReadAsStreamAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audio stream: {FileName}", fileName);
            throw;
        }
    }

    public async Task<byte[]> GetAudioBytesAsync(string fileName)
    {
        if (string.IsNullOrEmpty(fileName))
        {
            return Array.Empty<byte>();
        }

        try
        {
            using var stream = await GetAudioStreamAsync(fileName);
            using var memoryStream = new MemoryStream();
            await stream.CopyToAsync(memoryStream);
            return memoryStream.ToArray();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audio bytes: {FileName}", fileName);
            return Array.Empty<byte>();
        }
    }

    private async Task EnsureAudioFolderExists()
    {
        try
        {
            using var request = CreateAuthenticatedRequest(new HttpMethod("PROPFIND"), _audioFolder);
            var response = await _httpClient.SendAsync(request);

            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                using var mkcolRequest = CreateAuthenticatedRequest(new HttpMethod("MKCOL"), _audioFolder);
                var mkcolResponse = await _httpClient.SendAsync(mkcolRequest);

                if (!mkcolResponse.IsSuccessStatusCode)
                {
                    var errorContent = await mkcolResponse.Content.ReadAsStringAsync();
                    _logger.LogError("Failed to create audio folder. Status: {StatusCode}, Error: {Error}",
                        mkcolResponse.StatusCode, errorContent);
                    throw new Exception($"Failed to create audio folder: {mkcolResponse.StatusCode}");
                }

                _logger.LogInformation("Audio folder created: {Folder}", _audioFolder);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ensuring audio folder exists");
            throw;
        }
    }

    private string GetAudioMimeType(string fileExtension)
    {
        return fileExtension.ToLowerInvariant() switch
        {
            ".mp3" => "audio/mpeg",
            ".wav" => "audio/wav",
            ".ogg" => "audio/ogg",
            ".m4a" => "audio/mp4",
            ".aac" => "audio/aac",
            ".flac" => "audio/flac",
            ".opus" => "audio/opus",
            _ => "application/octet-stream"
        };
    }

    #endregion

    #region Avatar Methods (остаются как есть)

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

    private string GenerateDefaultAvatarUrl(string fileName, string? scheme = null, string? host = null)
    {
        if (!string.IsNullOrEmpty(scheme) && !string.IsNullOrEmpty(host))
        {
            return $"{scheme}://{host}/api/avatars/default/{fileName}";
        }

        return $"/api/avatars/default/{fileName}";
    }

    #endregion

    #region Connection Test

    public async Task<bool> TestConnectionAsync()
    {
        try
        {
            using var request = CreateAuthenticatedRequest(new HttpMethod("PROPFIND"), "/");
            var response = await _httpClient.SendAsync(request);

            _logger.LogInformation("WebDAV connection test: {StatusCode}", response.StatusCode);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogDebug("WebDAV directory listing: {Content}", content);

                await EnsureFolderExists(_avatarsFolder);
                await EnsureFolderExists(_audioFolder);
                await EnsureAlbumCoversFolderExists();

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

    private async Task EnsureFolderExists(string folderPath)
    {
        try
        {
            using var request = CreateAuthenticatedRequest(new HttpMethod("PROPFIND"), folderPath);
            var response = await _httpClient.SendAsync(request);

            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                using var mkcolRequest = CreateAuthenticatedRequest(new HttpMethod("MKCOL"), folderPath);
                var mkcolResponse = await _httpClient.SendAsync(mkcolRequest);

                if (mkcolResponse.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Folder created: {Folder}", folderPath);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ensuring folder exists: {Folder}", folderPath);
        }
    }

    #endregion

    public async Task<string> GetAlbumCoverUrlAsync(string fileName)
    {
        try
        {
            if (string.IsNullOrEmpty(fileName))
            {
                return string.Empty;
            }

            if (fileName.StartsWith("data:image/") || Uri.IsWellFormedUriString(fileName, UriKind.Absolute))
            {
                return fileName;
            }

            var bytes = await GetAlbumCoverBytesAsync(fileName);
            if (bytes == null || bytes.Length == 0)
            {
                _logger.LogWarning("Album cover file empty or not found: {FileName}", fileName);
                return string.Empty;
            }

            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            var mimeType = GetImageMimeType(extension);

            var base64String = Convert.ToBase64String(bytes);
            var dataUrl = $"data:{mimeType};base64,{base64String}";

            _logger.LogDebug("Album cover converted to base64: {FileName} -> {DataUrlPreview}...",
                fileName, dataUrl.Substring(0, Math.Min(50, dataUrl.Length)));

            return dataUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting album cover URL for {FileName}", fileName);
            return string.Empty;
        }
    }

    private string GetImageMimeType(string fileExtension)
    {
        return fileExtension.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".bmp" => "image/bmp",
            ".svg" => "image/svg+xml",
            _ => "image/jpeg" 
        };
    }
}
