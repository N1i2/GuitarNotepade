using System.Reflection;
using Domain.Common;
using Domain.Entities;
using Domain.Entities.Base;

namespace UnitTests.Helpers;

internal static class UserTestFactory
{
    internal static User Create(
        string email = "user@test.com",
        string nikName = "testuser",
        string role = Constants.Roles.User,
        bool premium = false)
    {
        var user = User.Create(email, nikName, "valid_password_hash_value", role);
        typeof(BaseEntityWithId)
            .GetProperty(nameof(BaseEntityWithId.Id), BindingFlags.Public | BindingFlags.Instance)!
            .SetValue(user, Guid.NewGuid());

        if (premium)
        {
            user.MakePremium();
        }

        return user;
    }
}
