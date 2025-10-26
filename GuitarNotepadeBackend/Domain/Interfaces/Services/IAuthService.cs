using Domain.Entities;

namespace Domain.Interfaces.Services;

public interface IAuthService
{
    Task<string> GenerateJwtTokenAsync(User user);
    Task<bool> ValidatePasswordAsync(string password, string passwordHash);
    string HashPassword(string password);
}