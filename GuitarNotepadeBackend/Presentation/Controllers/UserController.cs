using Domain.Common;
using Application.DTOs.Generic;
using Application.DTOs.Users;
using Application.Features.Commands.Users;
using Application.Features.Queries.Users;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IMapper _mapper;

    public UserController(IMediator mediator, IMapper mapper)
    {
        _mediator = mediator;
        _mapper = mapper;
    }

    /// <summary>
    /// Get all users
    /// </summary>
    /// <param name="emailFilter"></param>
    /// <param name="nikNameFilter"></param>
    /// <param name="isBlocked">Only from admin</param>
    /// <param name="role">Only from admin</param>
    /// <param name="page"></param>
    /// <param name="pageSize"></param>
    /// <param name="sortBy"></param>
    /// <param name="sortOrder"></param>
    /// <returns></returns>
    [HttpGet("users")]
    public async Task<ActionResult<PaginatedDto<UserProfileDto>>> GetAllUsers(
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

    /// <summary>
    /// Get profile by email
    /// </summary>
    /// <param name="email"></param>
    /// <returns></returns>
    [HttpGet("get-user/{email}")]
    public async Task<ActionResult<UserProfileDto>> GetProfile(string email)
    {
        try
        {
            var query = new GetUserByEmailQuery(email);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get current profile
    /// </summary>
    /// <returns></returns>
    [HttpGet("profile")]
    public async Task<ActionResult<UserProfileDto>> GetProfile()
    {
        try
        {
            var userId = GetCurrentUserId();
            var query = new GetCurrentUserQuery(userId);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Update information in your profile
    /// </summary>
    /// <param name="dto"></param>
    /// <returns></returns>
    [HttpPut("profile")]
    public async Task<ActionResult<UserProfileDto>> UpdateProfile([FromBody] UpdateUserProfileWithIdDto dto)
    {
        try
        {
            var command = _mapper.Map<UpdateUserProfileCommand>(dto);
            var result = await _mediator.Send(command);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Change current password
    /// </summary>
    /// <param name="dto"></param>
    /// <returns></returns>
    [HttpPut("change-password")]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new ChangePasswordCommand(
                userId,
                dto.CurrentPassword,
                dto.NewPassword,
                dto.ConfirmNewPassword);

            await _mediator.Send(command);
            return Ok(new { message = "Password changed successfully" });
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
