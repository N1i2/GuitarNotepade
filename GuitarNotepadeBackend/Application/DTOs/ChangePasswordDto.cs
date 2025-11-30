public record ChangePasswordDto(
    Guid UserId,
    string CurrentPassword,
    string NewPassword,
    string ConfirmNewPassword);