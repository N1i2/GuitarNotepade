using Domain.Interfaces.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _uploadsPath;
    private readonly string _baseUrl;

    public FileStorageService(IWebHostEnvironment environment, IConfiguration configuration)
    {
        _uploadsPath = Path.Combine(environment.WebRootPath, "uploads");
        _baseUrl = configuration["BaseUrl"] ?? "https://localhost:7001";

        Directory.CreateDirectory(Path.Combine(_uploadsPath, "audio"));
        Directory.CreateDirectory(Path.Combine(_uploadsPath, "images"));
        Directory.CreateDirectory(Path.Combine(_uploadsPath, "chords"));
        Directory.CreateDirectory(Path.Combine(_uploadsPath, "avatars"));
    }

    public async Task<string> SaveAudioFileAsync(Stream fileStream, string fileName)
    {
        return await SaveFileAsync(fileStream, fileName, "audio");
    }

    public async Task<string> SaveImageFileAsync(Stream fileStream, string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var allowedImageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

        if (!allowedImageExtensions.Contains(extension))
            throw new ArgumentException("Invalid image format");

        return await SaveFileAsync(fileStream, fileName, "images");
    }

    private async Task<string> SaveFileAsync(Stream fileStream, string fileName, string folder)
    {
        var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(fileName)}";
        var filePath = Path.Combine(_uploadsPath, folder, uniqueFileName);

        using var file = new FileStream(filePath, FileMode.Create);
        await fileStream.CopyToAsync(file);

        return $"{_baseUrl}/uploads/{folder}/{uniqueFileName}";
    }

    public Task DeleteFileAsync(string fileUrl)
    {
        if (string.IsNullOrEmpty(fileUrl))
            return Task.CompletedTask;

        try
        {
            var fileName = Path.GetFileName(fileUrl);
            var filePath = Path.Combine(_uploadsPath, fileName);

            if (File.Exists(filePath))
                File.Delete(filePath);
        }
        catch
        {
        }

        return Task.CompletedTask;
    }
}