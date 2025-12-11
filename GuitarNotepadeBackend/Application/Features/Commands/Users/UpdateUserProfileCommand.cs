using Application.DTOs;
using MediatR;

namespace Application.Features.Commands.Users;

public class UpdateUserProfileCommand : IRequest<UserProfileDto>
{
    public Guid UserId { get; set; }
    public string? NikName { get; set; }
    public string? AvatarBase64 { get; set; }
    public string? Bio { get; set; }

    public UpdateUserProfileCommand() { }

    public UpdateUserProfileCommand(
        Guid userId,
        string? nikName = null,
        string? avatarBase64 = null,
        string? bio = null)
    {
        UserId = userId;
        NikName = nikName;
        AvatarBase64 = avatarBase64;
        Bio = bio;
    }
}