using Domain.Interfaces.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Text.Json;

namespace Infrastructure.Services
{
    public class CoverService : ICoverService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<CoverService> _logger;
        private readonly IMemoryCache _cache;

        public CoverService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<CoverService> logger,
            IMemoryCache cache)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
            _cache = cache;
        }

        public async Task<string?> UploadCoverAsync(Stream coverStream, string fileName, Guid userId, CancellationToken cancellationToken = default)
        {
            try
            {
                var accessToken = _configuration["YandexDisk:AccessToken"];
                if (string.IsNullOrEmpty(accessToken))
                {
                    _logger.LogError("YandexDisk access token is not configured");
                    return null;
                }

                _logger.LogInformation("Uploading cover for user {UserId}, fileName: {FileName}", userId, fileName);

                var fileExtension = Path.GetExtension(fileName).ToLowerInvariant();
                var safeFileName = $"{Guid.NewGuid():N}_{DateTime.UtcNow.Ticks}{fileExtension}";
                var folderPath = $"AlbumCovers/{userId:N}";
                var remotePath = $"{folderPath}/{safeFileName}";

                var folderExists = await CheckOrCreateFolderAsync(folderPath, accessToken, cancellationToken);
                if (!folderExists)
                {
                    _logger.LogError("Failed to create or access folder: {FolderPath}", folderPath);
                    return null;
                }

                var uploadUrl = await GetUploadUrlAsync(remotePath, accessToken, cancellationToken);
                if (string.IsNullOrEmpty(uploadUrl))
                {
                    _logger.LogError("Failed to get upload URL for {RemotePath}", remotePath);
                    return null;
                }

                coverStream.Position = 0;
                using var content = new StreamContent(coverStream);
                content.Headers.ContentType = new MediaTypeHeaderValue(GetMimeType(fileExtension));

                var uploadResponse = await _httpClient.PutAsync(uploadUrl, content, cancellationToken);
                if (!uploadResponse.IsSuccessStatusCode)
                {
                    var error = await uploadResponse.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogError("Failed to upload cover to Yandex.Disk. Status: {StatusCode}, Error: {Error}",
                        uploadResponse.StatusCode, error);
                    return null;
                }

                _logger.LogInformation("Cover uploaded successfully: {RemotePath}", remotePath);

                return remotePath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading cover to Yandex.Disk for user {UserId}", userId);
                return null;
            }
        }

        public async Task<bool> DeleteCoverAsync(string coverUrl, CancellationToken cancellationToken = default)
        {
            try
            {
                if (string.IsNullOrEmpty(coverUrl))
                {
                    return false;
                }

                var accessToken = _configuration["YandexDisk:AccessToken"];
                if (string.IsNullOrEmpty(accessToken))
                {
                    _logger.LogError("YandexDisk access token is not configured");
                    return false;
                }

                _logger.LogInformation("Deleting cover: {CoverUrl}", coverUrl);

                var path = ExtractPathFromUrl(coverUrl);
                if (string.IsNullOrEmpty(path))
                {
                    _logger.LogError("Failed to extract path from URL: {Url}", coverUrl);
                    return false;
                }

                var url = $"https://cloud-api.yandex.net/v1/disk/resources?path={Uri.EscapeDataString(path)}&permanently=true";

                using var request = new HttpRequestMessage(HttpMethod.Delete, url);
                request.Headers.Authorization = new AuthenticationHeaderValue("OAuth", accessToken);

                var response = await _httpClient.SendAsync(request, cancellationToken);

                if (response.IsSuccessStatusCode)
                {
                    var cacheKey = $"cover_url_{path}";
                    _cache.Remove(cacheKey);

                    _logger.LogInformation("Cover deleted successfully: {Path}", path);
                    return true;
                }

                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    _logger.LogInformation("Cover already deleted or not found: {Path}", path);
                    return true;
                }

                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Failed to delete cover. Status: {StatusCode}, Error: {Error}",
                    response.StatusCode, error);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting cover: {CoverUrl}", coverUrl);
                return false;
            }
        }

        public async Task<string?> UpdateCoverAsync(
            Stream? newCoverStream,
            string fileName,
            Guid userId,
            string? oldCoverUrl,
            CancellationToken cancellationToken = default)
        {
            try
            {
                if (!string.IsNullOrEmpty(oldCoverUrl))
                {
                    await DeleteCoverAsync(oldCoverUrl, cancellationToken);
                }

                if (newCoverStream != null)
                {
                    return await UploadCoverAsync(newCoverStream, fileName, userId, cancellationToken);
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating cover for user {UserId}", userId);
                return null;
            }
        }

        public async Task<string?> GetCoverUrlAsync(string filePath, CancellationToken cancellationToken = default)
        {
            try
            {
                if (string.IsNullOrEmpty(filePath))
                {
                    return null;
                }

                if (filePath.StartsWith("http://") || filePath.StartsWith("https://"))
                {
                    return filePath;
                }

                var cacheKey = $"cover_url_{filePath}";
                if (_cache.TryGetValue(cacheKey, out string? cachedUrl) && !string.IsNullOrEmpty(cachedUrl))
                {
                    return cachedUrl;
                }

                var accessToken = _configuration["YandexDisk:AccessToken"];
                if (string.IsNullOrEmpty(accessToken))
                {
                    _logger.LogError("YandexDisk access token is not configured");
                    return null;
                }

                var downloadUrl = await GetDownloadUrlAsync(filePath, accessToken, cancellationToken);

                if (!string.IsNullOrEmpty(downloadUrl))
                {
                    _cache.Set(cacheKey, downloadUrl, TimeSpan.FromHours(1));
                    return downloadUrl;
                }

                _logger.LogWarning("Could not generate download URL for cover: {FilePath}", filePath);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cover URL for {FilePath}", filePath);
                return null;
            }
        }

        #region Private Methods

        private async Task<bool> CheckOrCreateFolderAsync(string folderPath, string accessToken, CancellationToken cancellationToken)
        {
            try
            {
                var checkUrl = $"https://cloud-api.yandex.net/v1/disk/resources?path={Uri.EscapeDataString(folderPath)}";

                using var request = new HttpRequestMessage(HttpMethod.Get, checkUrl);
                request.Headers.Authorization = new AuthenticationHeaderValue("OAuth", accessToken);

                var response = await _httpClient.SendAsync(request, cancellationToken);

                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    _logger.LogInformation("Folder not found, creating: {FolderPath}", folderPath);

                    var createUrl = $"https://cloud-api.yandex.net/v1/disk/resources?path={Uri.EscapeDataString(folderPath)}";

                    using var createRequest = new HttpRequestMessage(HttpMethod.Put, createUrl);
                    createRequest.Headers.Authorization = new AuthenticationHeaderValue("OAuth", accessToken);

                    var createResponse = await _httpClient.SendAsync(createRequest, cancellationToken);

                    if (!createResponse.IsSuccessStatusCode)
                    {
                        var error = await createResponse.Content.ReadAsStringAsync(cancellationToken);
                        _logger.LogError("Failed to create folder. Status: {StatusCode}, Error: {Error}",
                            createResponse.StatusCode, error);
                        return false;
                    }

                    _logger.LogInformation("Folder created successfully: {FolderPath}", folderPath);
                    return true;
                }

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking/creating folder: {FolderPath}", folderPath);
                return false;
            }
        }

        private async Task<string?> GetUploadUrlAsync(string remotePath, string accessToken, CancellationToken cancellationToken)
        {
            try
            {
                var url = $"https://cloud-api.yandex.net/v1/disk/resources/upload?path={Uri.EscapeDataString(remotePath)}&overwrite=true";

                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Authorization = new AuthenticationHeaderValue("OAuth", accessToken);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogError("Failed to get upload URL. Status: {StatusCode}, Error: {Error}",
                        response.StatusCode, error);
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                var json = JsonDocument.Parse(content);

                if (json.RootElement.TryGetProperty("href", out var hrefElement))
                {
                    return hrefElement.GetString();
                }

                _logger.LogError("Upload URL not found in response: {Content}", content);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting upload URL for {RemotePath}", remotePath);
                return null;
            }
        }

        private async Task<string?> GetDownloadUrlAsync(string filePath, string accessToken, CancellationToken cancellationToken)
        {
            try
            {
                var url = $"https://cloud-api.yandex.net/v1/disk/resources/download?path={Uri.EscapeDataString(filePath)}";

                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Authorization = new AuthenticationHeaderValue("OAuth", accessToken);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    if (response.StatusCode != System.Net.HttpStatusCode.NotFound)
                    {
                        var error = await response.Content.ReadAsStringAsync(cancellationToken);
                        _logger.LogError("Failed to get download URL. Status: {StatusCode}, Error: {Error}",
                            response.StatusCode, error);
                    }
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                var json = JsonDocument.Parse(content);

                if (json.RootElement.TryGetProperty("href", out var hrefElement))
                {
                    return hrefElement.GetString();
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting download URL for {FilePath}", filePath);
                return null;
            }
        }

        private string GetMimeType(string fileExtension)
        {
            return fileExtension.ToLowerInvariant() switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                ".bmp" => "image/bmp",
                ".svg" => "image/svg+xml",
                _ => "application/octet-stream"
            };
        }

        private string? ExtractPathFromUrl(string url)
        {
            try
            {
                if (url.StartsWith("AlbumCovers/"))
                {
                    return url;
                }

                var uri = new Uri(url);

                if (uri.Host.Contains("yandex") && !string.IsNullOrEmpty(uri.Query))
                {
                    var query = uri.Query.TrimStart('?');
                    foreach (var pair in query.Split('&'))
                    {
                        var kv = pair.Split('=', 2, StringSplitOptions.None);
                        if (kv.Length == 2 && kv[0].Equals("path", StringComparison.OrdinalIgnoreCase))
                        {
                            var path = Uri.UnescapeDataString(kv[1]);
                            if (!string.IsNullOrEmpty(path))
                                return path;
                            break;
                        }
                    }
                }

                return null;
            }
            catch
            {
                return url;
            }
        }

        #endregion
    }
}