using Domain.Common;
using Domain.Entities.Base;
using Domain.ValidationRules.UserRules;
using System.Reflection.Metadata;
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
    public DateTime? BlockedUntil { get; private set; }
    public string? BlockReason { get; private set; }
    public DateTime CreateAt { get; set; }

    public bool IsBlocked => BlockedUntil.HasValue && BlockedUntil > DateTime.UtcNow;

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
        BlockedUntil = null;
        BlockReason = null;
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
        newUser.BlockedUntil = null;
        newUser.BlockReason = null;

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

    public void UpdateProfile(string? nikName = null, string? avatarUrl = null, string? bio = null)
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

    public void Block(DateTime blockedUntil, string reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ArgumentException("Block reason cannot be empty", nameof(reason));
        }

        if (blockedUntil <= DateTime.UtcNow)
        {
            throw new ArgumentException("Block until date must be in the future", nameof(blockedUntil));
        }

        if (blockedUntil > DateTime.UtcNow.AddYears(100))
        {
            throw new ArgumentException("Block duration cannot exceed 100 years", nameof(blockedUntil));
        }

        BlockedUntil = blockedUntil;
        BlockReason = reason;
    }

    public void Unblock()
    {
        BlockedUntil = null;
        BlockReason = null;
    }

    public void CheckAndClearExpiredBlock()
    {
        if (BlockedUntil.HasValue && BlockedUntil <= DateTime.UtcNow)
        {
            Unblock();
        }
    }

    public void MakeAdminRole() => Role = Constants.Roles.Admin;
    public void RemoveAdminRole() => Role = Constants.Roles.User;
    public void UpdateUrl(string? url) => AvatarUrl = url;

    public (bool IsBlocked, string? Message) GetBlockStatus()
    {
        CheckAndClearExpiredBlock();

        if (BlockedUntil.HasValue && BlockedUntil > DateTime.UtcNow)
        {
            var timeLeft = BlockedUntil.Value - DateTime.UtcNow;
            var message = $"Account blocked until {BlockedUntil.Value:yyyy-MM-dd HH:mm} UTC. Reason: {BlockReason}";

            return (true, message);
        }

        return (false, null);
    }
}