using Domain.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly IWebDavService _webDavService;
    private readonly ILogger<TestController> _logger;

    public TestController(IWebDavService webDavService, ILogger<TestController> logger)
    {
        _webDavService = webDavService;
        _logger = logger;
    }

    [HttpGet("webdav")]
    [AllowAnonymous]
    public async Task<IActionResult> TestWebDavConnection()
    {
        try
        {
            _logger.LogInformation("Testing WebDAV connection...");

            // Простой тест - пытаемся получить дефолтный аватар
            var defaultAvatar = await _webDavService.GetRandomDefaultAvatarAsync();

            return Ok(new
            {
                success = true,
                message = "WebDAV connection successful",
                defaultAvatar = defaultAvatar
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "WebDAV test failed");
            return StatusCode(500, new
            {
                success = false,
                message = $"WebDAV test error: {ex.Message}",
                details = ex.InnerException?.Message
            });
        }
    }

    [HttpGet("webdav/files")]
    [AllowAnonymous]
    public async Task<IActionResult> ListFiles()
    {
        try
        {
            // Тест получения файла
            var fileName = "default_1.jpg";
            var exists = await _webDavService.AvatarExistsAsync(fileName);

            return Ok(new
            {
                success = true,
                fileName,
                exists,
                message = exists ? "File exists" : "File not found"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing files");
            return StatusCode(500, new
            {
                success = false,
                message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpGet("webdav/get-avatar")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvatarTest()
    {
        try
        {
            var fileName = "default_1.jpg";
            var avatarUrl = await _webDavService.GetAvatarUrlAsync(fileName);

            // Проверяем, является ли результат base64
            var isBase64 = avatarUrl.Length > 100 &&
                          (avatarUrl.Contains('/') == false ||
                           avatarUrl.StartsWith("data:image") ||
                           avatarUrl.Length > 500);

            return Ok(new
            {
                success = true,
                fileName,
                resultLength = avatarUrl.Length,
                isBase64 = isBase64,
                preview = avatarUrl.Length > 100 ?
                    $"{avatarUrl.Substring(0, 50)}...{avatarUrl.Substring(avatarUrl.Length - 50)}" :
                    avatarUrl
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting avatar");
            return StatusCode(500, new
            {
                success = false,
                message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpGet("webdav/stream")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvatarStream()
    {
        try
        {
            var fileName = "default_1.jpg";
            var stream = await _webDavService.GetAvatarStreamAsync(fileName);

            // Проверяем, можно ли прочитать поток
            using var memoryStream = new MemoryStream();
            await stream.CopyToAsync(memoryStream);
            var bytes = memoryStream.ToArray();

            return Ok(new
            {
                success = true,
                fileName,
                bytesLength = bytes.Length,
                hasData = bytes.Length > 0,
                isImage = bytes.Length > 0 &&
                         (bytes[0] == 0xFF && bytes[1] == 0xD8) || // JPEG
                         (bytes[0] == 0x89 && bytes[1] == 0x50)    // PNG
            });
        }
        catch (FileNotFoundException ex)
        {
            return NotFound(new
            {
                success = false,
                message = $"File not found: {ex.Message}"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting avatar stream");
            return StatusCode(500, new
            {
                success = false,
                message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPost("webdav/upload-test")]
    [AllowAnonymous]
    public async Task<IActionResult> TestUpload()
    {
        try
        {
            // Создаем простой тестовый PNG (1x1 пиксель прозрачный)
            var testImage = new byte[]
            {
                0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
                0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
                0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
                0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
                0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
            };

            using var stream = new MemoryStream(testImage);
            var fileName = $"test_{Guid.NewGuid():N}.png";
            var userId = Guid.NewGuid();

            var result = await _webDavService.UploadAvatarAsync(stream, fileName, userId);

            return Ok(new
            {
                success = true,
                uploadedFileName = result,
                originalFileName = fileName,
                userId,
                message = "Test upload completed"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Test upload failed");
            return StatusCode(500, new
            {
                success = false,
                message = $"Test upload failed: {ex.Message}",
                details = ex.InnerException?.Message
            });
        }
    }

    [HttpDelete("webdav/cleanup/{fileName}")]
    [AllowAnonymous]
    public async Task<IActionResult> CleanupTestFile(string fileName)
    {
        try
        {
            if (!fileName.StartsWith("test_"))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Can only delete test files (starting with 'test_')"
                });
            }

            var deleted = await _webDavService.DeleteAvatarAsync(fileName);

            return Ok(new
            {
                success = deleted,
                fileName,
                message = deleted ? "File deleted" : "File not found or could not be deleted"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file");
            return StatusCode(500, new
            {
                success = false,
                message = $"Error: {ex.Message}"
            });
        }
    }
}





//{
//  "email": "nikola@gmail.com",
//  "password": "123456"
//}