using Application.DTOs.Generic;
using Application.DTOs.StrummingPatterns;
using Application.Features.Commands.Chords;
using Application.Features.Commands.StrummingPatterns;
using Application.Features.Queries.Chords;
using Application.Features.Queries.StrummingPatterns;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
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
            var userId = GetCurrentUserId();

            var filters = new StrummingPatternsFiltersDto
            {
                Name = name,
                MyPatternsOnly = myPatternsOnly,
                IsFingerStyle = isFingerStyle,
                UserId = myPatternsOnly.HasValue && myPatternsOnly.Value ? userId : null,
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

    [HttpGet("by-id/{id}")]
    public async Task<ActionResult<StrummingPatternsDto>> GetStrummingPaternById(Guid id)
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

    [HttpGet("by-name/{patternName}")]
    public async Task<ActionResult<StrummingPatternsDto>> GetStrummingPatternByName(string patternName)
    {
        try
        {
            var query = new GetPatternByNameQuery(patternName);
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

    [HttpPost]
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

            return CreatedAtAction(nameof(GetStrummingPaternById), new { id = result.Id }, result);
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