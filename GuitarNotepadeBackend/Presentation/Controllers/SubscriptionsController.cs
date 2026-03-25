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

    /// <summary>
    /// It only shows my subscriptions
    /// </summary>
    /// <returns></returns>
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

    /// <summary>
    /// Subscribe to album
    /// </summary>
    /// <param name="albumId"></param>
    /// <returns></returns>
    [HttpPost("{albumId}")]
    public async Task<ActionResult<SubscriptionResponseDto>> Subscribe(Guid albumId)
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

            var command = new SubscribeCommand(currentUserId, albumId);
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

    /// <summary>
    /// Unsubscribe to aldum
    /// </summary>
    /// <param name="albumId"></param>
    /// <returns></returns>
    [HttpDelete("{albumId}")]
    public async Task<ActionResult> Unsubscribe(Guid albumId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var command = new UnsubscribeCommand(currentUserId, albumId);
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

    /// <summary>
    /// Get album subscription by id
    /// </summary>
    /// <param name="albumId"></param>
    /// <returns></returns>
    [HttpGet("check/{albumId}")]
    public async Task<ActionResult<bool>> CheckAlbumSubscription(Guid albumId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var query = new CheckSubscriptionQuery(currentUserId, albumId);
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("count-of-create")]
    [Authorize]
    public async Task<int> CountOfCreateSubscription()
    {
        var userId = GetCurrentUserId();

        var command = new CountOfCreateSubscriptionCommand(userId);

        return await _mediator.Send(command);
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
