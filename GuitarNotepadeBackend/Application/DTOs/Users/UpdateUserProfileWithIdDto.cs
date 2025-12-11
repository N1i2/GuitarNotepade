namespace Application.DTOs.Users;

public record UpdateUserProfileWithIdDto(
    Guid UserId,
    string? NikName,
    string? AvatarBase64,
    string? Bio,
    bool RemoveAvatar = false);