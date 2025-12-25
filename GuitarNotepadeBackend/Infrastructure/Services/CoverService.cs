using Domain.Interfaces.Services;
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

        public CoverService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<CoverService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
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

                var folderPath = $"AlbumCovers/{userId:N}";

                var folderExists = await CheckOrCreateFolderAsync(folderPath, accessToken, cancellationToken);
                if (!folderExists)
                {
                    _logger.LogError("Failed to create or access folder: {FolderPath}", folderPath);
                    return null;
                }

                var uploadUrl = await GetUploadUrlAsync(folderPath, fileName, accessToken, cancellationToken);
                if (string.IsNullOrEmpty(uploadUrl))
                {
                    _logger.LogError("Failed to get upload URL");
                    return null;
                }

                coverStream.Position = 0;
                using var content = new StreamContent(coverStream);
                content.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");

                var uploadResponse = await _httpClient.PutAsync(uploadUrl, content, cancellationToken);
                if (!uploadResponse.IsSuccessStatusCode)
                {
                    _logger.LogError("Failed to upload cover to Yandex.Disk. Status: {StatusCode}", uploadResponse.StatusCode);
                    return null;
                }

                var publicUrl = await GetDownloadUrlAsync($"{folderPath}/{fileName}", accessToken, cancellationToken);
                return publicUrl;

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading cover to Yandex.Disk");
                return null;
            }
        }

        public async Task<bool> DeleteCoverAsync(string coverUrl, CancellationToken cancellationToken = default)
        {
            try
            {
                var accessToken = _configuration["YandexDisk:AccessToken"];
                if (string.IsNullOrEmpty(accessToken))
                {
                    _logger.LogError("YandexDisk access token is not configured");
                    return false;
                }

                var path = ExtractPathFromUrl(coverUrl);
                if (string.IsNullOrEmpty(path))
                {
                    _logger.LogError("Failed to extract path from URL: {Url}", coverUrl);
                    return false;
                }

                var url = $"https://cloud-api.yandex.net/v1/disk/resources?path={Uri.EscapeDataString(path)}";

                var request = new HttpRequestMessage(HttpMethod.Delete, url);
                request.Headers.Authorization = new AuthenticationHeaderValue("OAuth", accessToken);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting cover from Yandex.Disk");
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
            if (!string.IsNullOrEmpty(oldCoverUrl))
            {
                await DeleteCoverAsync(oldCoverUrl, cancellationToken);
            }

            if (newCoverStream == null)
            {
                return null;
            }

            return await UploadCoverAsync(newCoverStream, fileName, userId, cancellationToken);
        }

        private async Task<bool> CheckOrCreateFolderAsync(string folderPath, string accessToken, CancellationToken cancellationToken)
        {
            try
            {
                var checkUrl = $"https://cloud-api.yandex.net/v1/disk/resources?path={Uri.EscapeDataString(folderPath)}";

                var request = new HttpRequestMessage(HttpMethod.Get, checkUrl);
                request.Headers.Authorization = new AuthenticationHeaderValue("OAuth", accessToken);

                var response = await _httpClient.SendAsync(request, cancellationToken);

                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    var createUrl = $"https://cloud-api.yandex.net/v1/disk/resources?path={Uri.EscapeDataString(folderPath)}";

                    var createRequest = new HttpRequestMessage(HttpMethod.Put, createUrl);
                    createRequest.Headers.Authorization = new AuthenticationHeaderValue("OAuth", accessToken);

                    var createResponse = await _httpClient.SendAsync(createRequest, cancellationToken);
                    return createResponse.IsSuccessStatusCode;
                }

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking/creating folder: {FolderPath}", folderPath);
                return false;
            }
        }

        private async Task<string?> GetUploadUrlAsync(string folderPath, string fileName, string accessToken, CancellationToken cancellationToken)
        {
            try
            {
                var url = $"https://cloud-api.yandex.net/v1/disk/resources/upload?path={Uri.EscapeDataString($"{folderPath}/{fileName}")}&overwrite=true";

                var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Authorization = new AuthenticationHeaderValue("OAuth", accessToken);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Failed to get upload URL. Status: {StatusCode}", response.StatusCode);
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
                _logger.LogError(ex, "Error getting upload URL");
                return null;
            }
        }

        private async Task<string?> GetDownloadUrlAsync(string filePath, string accessToken, CancellationToken cancellationToken)
        {
            try
            {
                var url = $"https://cloud-api.yandex.net/v1/disk/resources/download?path={Uri.EscapeDataString(filePath)}";

                var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Authorization = new AuthenticationHeaderValue("OAuth", accessToken);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Failed to get download URL. Status: {StatusCode}", response.StatusCode);
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
                _logger.LogError(ex, "Error getting download URL");
                return null;
            }
        }

        private string? ExtractPathFromUrl(string url)
        {
            try
            {
                var uri = new Uri(url);

                var query = uri.Query;
                if (!string.IsNullOrEmpty(query))
                {
                    var queryParams = System.Web.HttpUtility.ParseQueryString(query);
                    var path = queryParams["path"];
                    if (!string.IsNullOrEmpty(path))
                    {
                        return path;
                    }
                }

                var pathParts = uri.AbsolutePath.Split('/');
                if (pathParts.Length > 4)
                {
                    return string.Join("/", pathParts.Skip(4));
                }

                return null;
            }
            catch
            {
                return null;
            }
        }
    }
}