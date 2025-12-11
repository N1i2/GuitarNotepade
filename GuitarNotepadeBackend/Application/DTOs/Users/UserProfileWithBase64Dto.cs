namespace Application.DTOs.Users;

public record UserProfileWithBase64Dto(
    Guid Id,
    string Email,
    string NikName,
    string Role,
    string? AvatarBase64,
    string? Bio,
    DateTime CreateAt);