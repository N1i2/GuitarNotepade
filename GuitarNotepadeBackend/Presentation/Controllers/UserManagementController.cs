using Application.Features.Commands;
using Application.Features.Queries;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Domain.Common;
using Application.DTOs.Users;
using Application.Features.Queries.Users;
using Application.Features.Commands.Users;

namespace Presentation.Controllers;

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

    [HttpGet("users")]
    public async Task<ActionResult<PaginatedResultDto<UserProfileDto>>> GetAllUsers(
        [FromQuery] string? emailFilter = null,
        [FromQuery] string? nikNameFilter = null,
        [FromQuery] bool? isBlocked = null,
        [FromQuery] string? role = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = Constants.DefaultPageSize,
        [FromQuery] string sortBy = Constants.Sorting.CreatedAt,
        [FromQuery] string sortOrder = Constants.Sorting.Descending)
    {
        try
        {
            var query = new GetAllUsersQuery(
                emailFilter: emailFilter,
                nikNameFilter: nikNameFilter,
                isBlocked: isBlocked,
                role: role,
                page: page,
                pageSize: pageSize,
                sortBy: sortBy,
                sortOrder: sortOrder);

            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

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

    [HttpPut("unblock-user")]
    public async Task<ActionResult<BlockUserResponseDto>> UnblockUser([FromBody] BlockByEmailDto dto)
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

    [HttpPut("toggle-user-role")]
    public async Task<ActionResult> MakeAdminByEmail([FromBody] ChangeRoleByEmailDto dto)
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
                message = $"User with email '{dto.Email}' is now an administrator",
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