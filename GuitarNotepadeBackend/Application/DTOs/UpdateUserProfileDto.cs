public record UpdateUserProfileDto(
    Guid UserId,
    string? NikName,
    string? Bio);