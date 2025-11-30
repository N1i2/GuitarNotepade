using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Domain.Entities;
using Domain.Interfaces.Services;
using Microsoft.IdentityModel.Tokens;

namespace Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly string _jwtSecret;
    private readonly string _jwtIssuer;
    private readonly string _jwtAudience;

    public AuthService()
    {
        _jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")
                     ?? throw new ArgumentNullException("JWT_SECRET is not set in .env");
        _jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "GuitarNotepad";
        _jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "GuitarNotepadUsers";

        if (_jwtSecret.Length < 32)
        {
            throw new ArgumentException("JWT secret must be at least 32 characters long");
        }
    }

    public async Task<string> GenerateJwtTokenAsync(User user)
    {
        await Task.CompletedTask;

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()), 
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.NikName),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), 
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("userId", user.Id.ToString()), 
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtIssuer,
            audience: _jwtAudience,
            claims: claims,
            expires: DateTime.Now.AddHours(24),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(password);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }

    public async Task<bool> ValidatePasswordAsync(string password, string passwordHash)
    {
        await Task.CompletedTask;

        var hashedPassword = HashPassword(password);
        return hashedPassword == passwordHash;
    }
}