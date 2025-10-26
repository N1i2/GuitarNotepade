namespace Domain.Interfaces.Services;

public interface IFileStorageService
{
    Task<string> SaveAudioFileAsync(Stream fileStream, string fileName);
    Task<string> SaveImageFileAsync(Stream fileStream, string fileName);
    Task DeleteFileAsync(string fileUrl);
}