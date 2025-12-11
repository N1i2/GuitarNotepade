using Application.DTOs.Chords;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Application.Features.Queries.Chords;
using Application.Features.Commands.Chords;
using Application.Features.Chords.Queries;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChordsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IMapper _mapper;

    public ChordsController(IMediator mediator, IMapper mapper)
    {
        _mediator = mediator;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedChordsDto>> GetAllChords(
        [FromQuery] string? name = null,
        [FromQuery] bool? myChordsOnly = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "name",
        [FromQuery] string sortOrder = "asc")
    {
        try
        {
            var userId = GetCurrentUserId();

            var filters = new ChordFiltersDto
            {
                Name = name,
                MyChordsOnly = myChordsOnly,
                UserId = myChordsOnly.HasValue && myChordsOnly.Value ? userId : null, 
                Page = page,
                PageSize = pageSize,
                SortBy = sortBy,
                SortOrder = sortOrder
            };

            var query = new GetAllChordsQuery(filters);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ChordDto>> GetChordById(Guid id)
    {
        try
        {
            var query = new GetChordByIdQuery(id);
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

    [HttpGet("exact/{name}")]
    public async Task<ActionResult<PaginatedChordsDto>> GetChordsByExactName(
    string name,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 20)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new { error = "Chord name cannot be empty" });
            }

            var query = new GetChordsByExactNameQuery(name, page, pageSize);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }


    [HttpGet("search")]
    public async Task<ActionResult<PaginatedChordsDto>> SearchChordsByName(
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

            var query = new SearchChordsByNameQuery(name, page, pageSize);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("my-chords")]
    public async Task<ActionResult<PaginatedChordsDto>> GetMyChords(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var userId = GetCurrentUserId();
            var query = new GetMyChordsQuery(userId, page, pageSize);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("distinct")]
    public async Task<ActionResult<PaginatedChordsDto>> GetDistinctChordNames(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 48,
        [FromQuery] string sortBy = "name",
        [FromQuery] string sortOrder = "asc")
    {
        await Task.CompletedTask;

        try
        {
            return Ok(new PaginatedChordsDto()); 
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<ChordDto>> CreateChord([FromBody] CreateChordDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new CreateChordCommand(
                dto.Name,
                dto.Fingering,
                userId,
                dto.Description);

            var result = await _mediator.Send(command);

            return CreatedAtAction(nameof(GetChordById), new { id = result.Id }, result);
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
    public async Task<ActionResult<ChordDto>> UpdateChord(Guid id, [FromBody] UpdateChordDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new UpdateChordCommand(
                id,
                userId,
                dto.Name,
                dto.Fingering,
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
    public async Task<ActionResult> DeleteChord(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var command = new DeleteChordCommand(id, userId, userRole);
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