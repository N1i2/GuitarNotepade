using Domain.Common;
using Domain.Entities;
using Domain.Exceptions.UserExceptions;
using UnitTests.Helpers;

namespace UnitTests.Domain;

public class UserBlockAndRoleTests
{
    [Fact]
    public void T25_User_BlockAndUnblock_UpdatesStatus()
    {
        var user = UserTestFactory.Create();
        var until = DateTime.UtcNow.AddDays(7);

        user.Block(until, "Spam");
        var (isBlocked, message) = user.GetBlockStatus();
        Assert.True(isBlocked);
        Assert.Contains("Spam", message);

        user.Unblock();
        Assert.False(user.IsBlocked);
    }

    [Fact]
    public void User_CreateWithInvalidEmail_Throws()
    {
        Assert.Throws<EmailException>(() =>
            User.Create("bad", "nick", "hash", Constants.Roles.User));
    }

    [Fact]
    public void Admin_CannotBeBlocked()
    {
        var admin = UserTestFactory.Create(role: Constants.Roles.Admin);

        Assert.Throws<InvalidOperationException>(() =>
            admin.Block(DateTime.UtcNow.AddDays(1), "Test"));
    }
}
