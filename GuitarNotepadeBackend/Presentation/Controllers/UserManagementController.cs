using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Application.DTOs.Users;
using Application.Features.Commands.Users;

namespace Presentation.Controllers;

/// <summary>
/// Only from admin
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "Admin")]
public class UserManagementController : ControllerBase
{
    private readonly IMediator _mediator;

    public UserManagementController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Block user by email with required reason and date
    /// </summary>
    /// <param name="dto"></param>
    /// <returns></returns>
    [HttpPut("block-user")]
    public async Task<ActionResult<BlockUserResponseDto>> BlockUser([FromBody] BlockUserDto dto)
    {
        try
        {
            var currentAdminId = GetCurrentUserId();

            var command = new ToggleBlockStatusCommand(
                email: dto.Email,
                reason: dto.Reason,
                blockedUntil: dto.BlockedUntil.ToUniversalTime(),
                adminId: currentAdminId);

            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
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
    /// Unblock blocked user
    /// </summary>
    /// <param name="dto"></param>
    /// <returns></returns>
    [HttpPut("unblock-user")]
    public async Task<ActionResult<BlockUserResponseDto>> UnblockUser([FromBody] WorkWithUserByEmailDto dto)
    {
        try
        {
            var currentAdminId = GetCurrentUserId();

            var command = new ToggleBlockStatusCommand(
                email: dto.Email,
                adminId: currentAdminId);

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
    /// Toggle user role
    /// </summary>
    /// <param name="dto"></param>
    /// <returns></returns>
    [HttpPut("toggle-user-role")]
    public async Task<ActionResult> ToggleUserRole([FromBody] WorkWithUserByEmailDto dto)
    {
        try
        {
            var currentAdminId = GetCurrentUserId();

            var command = new ToggleUserRoleCommand(
                Email: dto.Email,
                AdminId: currentAdminId);

            var result = await _mediator.Send(command);

            return Ok(new
            {
                message = $"The user role with the email \"{dto.Email}\" has been changed.\r\n",
                userId = result
            });
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

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                         ?? User.FindFirst("sub");

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID in token");
        }

        return userId;
    }
}
