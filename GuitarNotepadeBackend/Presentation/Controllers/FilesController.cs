using Domain.Interfaces.Services;
using Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FilesController : ControllerBase
{
    private readonly IWebDavService _webDavService;

    public FilesController(IWebDavService webDavService)
    {
        _webDavService = webDavService;
    }

    [HttpGet("avatar/{fileName}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvatar(string fileName)
    {
        try
        {
            var stream = await _webDavService.GetAvatarStreamAsync(fileName);

            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            var contentType = GetContentType(extension);

            return File(stream, contentType);
        }
        catch (FileNotFoundException)
        {
            var defaultAvatarUrl = await _webDavService.GetRandomDefaultAvatarAsync();

            if (defaultAvatarUrl.StartsWith("/api/files/"))
            {
                var defaultFileName = Path.GetFileName(defaultAvatarUrl);
                return await GetAvatar(defaultFileName);
            }

            return Redirect(defaultAvatarUrl);
        }
    }

    [HttpGet("proxy-avatar/{fileName}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetProxyAvatar(string fileName)
    {
        return await GetAvatar(fileName);
    }

    [HttpGet("default-avatar/{fileName}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDefaultAvatar(string fileName)
    {
        fileName = $"Defaults/{fileName}";
        return await GetAvatar(fileName);
    }

    private string GetContentType(string extension)
    {
        return extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };
    }
}