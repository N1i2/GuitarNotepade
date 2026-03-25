using Application.DTOs.Notifications;
using Application.Features.Commands.Notifications;
using Application.Features.Queries.Notifications;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotificationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get my notifications with pagination
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<NotificationDto>>> GetMyNotifications(
        [FromQuery] int take = 50,
        [FromQuery] int skip = 0)
    {
        var userId = GetCurrentUserId();
        var query = new GetUserNotificationsQuery(userId, take, skip);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get count of unread notifications
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount()
    {
        var userId = GetCurrentUserId();
        var query = new GetUnreadNotificationsCountQuery(userId);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Mark a specific notification as read
    /// </summary>
    [HttpPost("{notificationId}/read")]
    public async Task<ActionResult> MarkAsRead(Guid notificationId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var command = new MarkNotificationAsReadCommand(userId, notificationId);
            await _mediator.Send(command);
            return Ok(new { message = "Notification marked as read" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Mark all notifications as read
    /// </summary>
    [HttpPost("read-all")]
    public async Task<ActionResult> MarkAllAsRead()
    {
        try
        {
            var userId = GetCurrentUserId();
            var command = new MarkAllNotificationsAsReadCommand(userId);
            var count = await _mediator.Send(command);
            return Ok(new { message = $"Marked {count} notifications as read", count });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a specific notification
    /// </summary>
    [HttpDelete("{notificationId}")]
    public async Task<ActionResult> DeleteNotification(Guid notificationId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var command = new DeleteNotificationCommand(userId, notificationId);
            await _mediator.Send(command);
            return Ok(new { message = "Notification deleted successfully" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Delete all read notifications
    /// </summary>
    [HttpDelete("read")]
    public async Task<ActionResult> DeleteReadNotifications()
    {
        try
        {
            var userId = GetCurrentUserId();
            var command = new DeleteReadNotificationsCommand(userId);
            var count = await _mediator.Send(command);
            return Ok(new { message = $"Deleted {count} read notifications", count });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                         ?? User.FindFirst("sub")
                         ?? User.FindFirst("userId");

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID in token");
        }

        return userId;
    }
}
