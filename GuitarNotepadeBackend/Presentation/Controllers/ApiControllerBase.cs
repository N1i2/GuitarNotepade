using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

public abstract class ApiControllerBase : ControllerBase
{
    protected bool IsUserAuthenticated() => User.Identity?.IsAuthenticated == true;

    protected Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                         ?? User.FindFirst("sub")
                         ?? User.FindFirst("userId");

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            throw new UnauthorizedAccessException("Invalid user ID in token");

        return userId;
    }

    protected Guid? TryGetCurrentUserId()
    {
        if (User.Identity?.IsAuthenticated != true)
            return null;

        try
        {
            return GetCurrentUserId();
        }
        catch
        {
            return null;
        }
    }

    protected string GetCurrentUserRole()
    {
        var roleClaim = User.FindFirst(ClaimTypes.Role)
                       ?? User.FindFirst("role");

        return roleClaim?.Value ?? "User";
    }
}
