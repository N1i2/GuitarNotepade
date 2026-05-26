using Domain.Common;
using UnitTests.Helpers;

namespace UnitTests.Domain;

public class UserQuotaTests
{
    [Fact]
    public void T13_FreeUser_CannotExceedSongLimit()
    {
        var user = UserTestFactory.Create(premium: false);

        Assert.True(user.CanCreateMoreSongs(Constants.Limits.FreeUserMaxSongs - 1));
        Assert.False(user.CanCreateMoreSongs(Constants.Limits.FreeUserMaxSongs));
    }

    [Fact]
    public void T21_PremiumUser_HasUnlimitedSongQuota()
    {
        var user = UserTestFactory.Create(premium: true);

        Assert.True(user.CanCreateMoreSongs(1000));
    }
}
