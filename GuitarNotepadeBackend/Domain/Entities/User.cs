using Domain.Entities.Base;
using Domain.ValidationRules.UserRules;
using System.Runtime.CompilerServices;

namespace Domain.Entities;

public class User : BaseEntityWithId
{
    public string Email { get; private set; }
    public string NikName { get; private set; }
    public string PasswordHash { get; private set; }
    public string Role { get; private set; }
    public string? AvatarUrl { get; private set; }
    public string Bio { get; private set; }
    public bool IsBlocked { get; private set; }
    public DateTime CreateAt { get; set; }

    public virtual ICollection<Song> Songs { get; private set; } = new List<Song>();
    public virtual ICollection<Album> Albums { get; private set; } = new List<Album>();
    public virtual ICollection<SongReview> Reviews { get; private set; } = new List<SongReview>();
    public virtual ICollection<UserFavoriteSong> FavoriteSongs { get; private set; } = new List<UserFavoriteSong>();
    public virtual ICollection<SongAudioRecording> AudioRecordings { get; private set; } = new List<SongAudioRecording>();

    private User()
    {
        Email = string.Empty;
        NikName = string.Empty;
        PasswordHash = string.Empty;
        Role = string.Empty;
        AvatarUrl = null;
        Bio = string.Empty;
    }

    public static User Create(string email, string nikName, string passwordHash, string role, string? avatar = null, string? bio = null)
    {
        EmailRule.IsValid(email);
        NikNameRule.IsValid(nikName);
        PasswordRule.IsValid(passwordHash);

        var newUser = new User();

        newUser.Email = email;
        newUser.NikName = nikName;
        newUser.PasswordHash = passwordHash;
        newUser.Role = role;
        newUser.IsBlocked = false;

        if (avatar != null)
        {
            newUser.AvatarUrl = avatar;
        }
        if (bio != null)
        {
            newUser.Bio = bio;
        }

        newUser.CreateAt = DateTime.UtcNow;

        return newUser;
    }
    public void UpdateProfile(string? nikName= null, string? avatarUrl = null, string? bio = null)
    {
        if (nikName != null)
        {
            NikNameRule.IsValid(nikName);
            NikName = nikName;
        }
        if (avatarUrl != null)
        {
            AvatarUrl = avatarUrl;
        }
        if (bio != null)
        {
            Bio = bio;
        }
    }
    public void ChangePassword(string newPasswordHash) => PasswordHash = newPasswordHash;
    public void Block() => IsBlocked = true;
    public void Unblock() => IsBlocked = false;
    public void UpdateUrl(string? url) => AvatarUrl = url;
}
