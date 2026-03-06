namespace Domain.Interfaces.Services;

public interface ICoverService
{
    Task<string?> UploadCoverAsync(Stream coverStream, string fileName, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteCoverAsync(string coverUrl, CancellationToken cancellationToken = default);
    Task<string?> UpdateCoverAsync(Stream? newCoverStream, string fileName, Guid userId, string? oldCoverUrl, CancellationToken cancellationToken = default);
}
