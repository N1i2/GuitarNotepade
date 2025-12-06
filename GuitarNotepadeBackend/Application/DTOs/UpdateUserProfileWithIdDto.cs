namespace Application.DTOs;

public record UpdateUserProfileWithIdDto(
    Guid UserId,
    string? NikName,
    string? AvatarBase64,
    string? Bio,
    bool RemoveAvatar = false);