using Application.DTOs.Subscriptions;
using Application.Features.Commands.Subscriptions;
using Application.Features.Queries.Subscriptions;
using Domain.Common;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubscriptionsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IUserService _userService;

    public SubscriptionsController(IMediator mediator, IUserService userService)
    {
        _mediator = mediator;
        _userService = userService;
    }

    [HttpGet]
    public async Task<ActionResult<List<SubscriptionDto>>> GetMySubscriptions()
    {
        try
        {
            var userId = GetCurrentUserId();
            var query = new GetUserSubscriptionsQuery(userId);
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("users/{userId}")]
    public async Task<ActionResult<SubscriptionResponseDto>> SubscribeToUser(Guid userId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == userId)
                return BadRequest(new { error = "Cannot subscribe to yourself" });

            var user = await _userService.GetByIdAsync(currentUserId);

            if (user.IsFreeUser)
            {
                var subscriptionsCount = await _mediator.Send(new GetUserSubscriptionsCountQuery(currentUserId));
                if (subscriptionsCount >= Constants.Limits.FreeUserMaxSubscriptions)
                {
                    return BadRequest(new
                    {
                        error = $"Free users can only subscribe to {Constants.Limits.FreeUserMaxSubscriptions} users. " +
                                "Upgrade to Premium for unlimited subscriptions."
                    });
                }
            }

            var command = new SubscribeToUserCommand(currentUserId, userId);
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("users/{userId}")]
    public async Task<ActionResult> UnsubscribeFromUser(Guid userId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var command = new UnsubscribeCommand(currentUserId, userId, true);
            await _mediator.Send(command);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("albums/{albumId}")]
    public async Task<ActionResult<SubscriptionResponseDto>> SubscribeToAlbum(Guid albumId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var user = await _userService.GetByIdAsync(currentUserId);

            if (user.IsFreeUser)
            {
                var subscriptionsCount = await _mediator.Send(new GetUserSubscriptionsCountQuery(currentUserId));
                if (subscriptionsCount >= Constants.Limits.FreeUserMaxSubscriptions)
                {
                    return BadRequest(new
                    {
                        error = $"Free users can only subscribe to {Constants.Limits.FreeUserMaxSubscriptions} albums. " +
                                "Upgrade to Premium for unlimited subscriptions."
                    });
                }
            }

            var command = new SubscribeToAlbumCommand(currentUserId, albumId);
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("albums/{albumId}")]
    public async Task<ActionResult> UnsubscribeFromAlbum(Guid albumId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var command = new UnsubscribeCommand(currentUserId, albumId, false);
            await _mediator.Send(command);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("check/user/{userId}")]
    public async Task<ActionResult<bool>> CheckUserSubscription(Guid userId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var query = new CheckSubscriptionQuery(currentUserId, userId, true);
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("check/album/{albumId}")]
    public async Task<ActionResult<bool>> CheckAlbumSubscription(Guid albumId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var query = new CheckSubscriptionQuery(currentUserId, albumId, false);
            var result = await _mediator.Send(query);
            return Ok(result);
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