using Application.DTOs.Generic;
using Application.DTOs.StrummingPatterns;
using Application.Features.Commands.StrummingPatterns;
using Application.Features.Queries.StrummingPatterns;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StrummingPatternsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IMapper _mapper;

    public StrummingPatternsController(IMediator mediator, IMapper mapper)
    {
        _mapper = mapper;
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedDto<StrummingPatternsDto>>> GetAllStrummingPatterns(
        [FromQuery] string? name = null,
        [FromQuery] bool? myPatternsOnly = false,
        [FromQuery] bool? isFingerStyle = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "name",
        [FromQuery] string sortOrder = "asc")
    {
        try
        {
            var isAuth = IsUserAuthenticated();

            if (!isAuth && myPatternsOnly == true)
            {
                return BadRequest(new { error = "Only authenticated users can view their own patterns" });
            }

            var filters = new StrummingPatternsFiltersDto
            {
                Name = name,
                MyPatternsOnly = isAuth ? myPatternsOnly : false,
                IsFingerStyle = isFingerStyle,
                UserId = isAuth && myPatternsOnly == true ? GetCurrentUserId() : null,
                Page = page,
                PageSize = pageSize,
                SortBy = sortBy,
                SortOrder = sortOrder
            };

            var query = new GetAllPatternsQuery(filters);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("search")]
    public async Task<ActionResult<PaginatedDto<StrummingPatternsDto>>> SearchPatternsByName(
        [FromQuery] string name,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new { error = "Search term cannot be empty" });
            }

            var filters = new StrummingPatternsFiltersDto
            {
                Name = name,
                Page = page,
                PageSize = pageSize,
                SortBy = "name", 
                SortOrder = "asc"
            };

            var query = new GetAllPatternsQuery(filters);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<StrummingPatternsDto>> GetStrummingPatternById(Guid id)
    {
        try
        {
            var query = new GetPatternByIdQuery(id);
            var result = await _mediator.Send(query);

            return Ok(result);
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

    [HttpGet("my-patterns")]
    [Authorize]
    public async Task<ActionResult<PaginatedDto<StrummingPatternsDto>>> GetMyPatterns(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var filters = new StrummingPatternsFiltersDto
            {
                MyPatternsOnly = true,
                UserId = GetCurrentUserId(),
                Page = page,
                PageSize = pageSize,
                SortBy = "createdat",
                SortOrder = "desc"
            };

            var query = new GetAllPatternsQuery(filters);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<StrummingPatternsDto>> CreatePattern([FromBody] CreatePatternDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new CreatePatternCommand(
                dto.Name,
                dto.Pattern,
                dto.IsFingerStyle,
                userId,
                dto.Description);

            var result = await _mediator.Send(command);

            return CreatedAtAction(nameof(GetStrummingPatternById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<StrummingPatternsDto>> UpdatePattern(Guid id, [FromBody] UpdatePatternDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var command = new UpdatePatternCommand(
                id,
                userId,
                dto.Name,
                dto.Pattern,
                dto.IsFingerStyle,
                dto.Description);

            var result = await _mediator.Send(command);

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            Console.WriteLine(ex.Message);
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult> DeletePattern(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var command = new DeletePatternCommand(id, userId, userRole);
            await _mediator.Send(command);

            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            Console.WriteLine(ex.Message);
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private bool IsUserAuthenticated()
    {
        return User.Identity?.IsAuthenticated == true;
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

    private string GetCurrentUserRole()
    {
        var roleClaim = User.FindFirst(ClaimTypes.Role)
                       ?? User.FindFirst("role");

        return roleClaim?.Value ?? "User";
    }
}