using Application.DTOs.Generic;
using Application.DTOs.Song;
using Application.Features.Commands.Songs;
using Application.Features.Queries.Songs;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SongsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IMapper _mapper;

    public SongsController(IMediator mediator, IMapper mapper)
    {
        _mediator = mediator;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<SongSearchResultDto>> SearchSongs(
        [FromQuery] Guid userId,
        [FromQuery] string? searchTerm = null,
        [FromQuery] Guid? ownerId = null,
        [FromQuery] bool? isPublic = null,
        [FromQuery] Guid? chordId = null,
        [FromQuery] Guid? patternId = null,
        [FromQuery] Guid? parentSongId = null,
        [FromQuery] decimal? minRating = null,
        [FromQuery] decimal? maxRating = null,
        [FromQuery] DateTime? createdFrom = null,
        [FromQuery] DateTime? createdTo = null,
        [FromQuery] string sortBy = "createdAt",
        [FromQuery] string sortOrder = "desc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var filters = new SongSearchFilters
            {
                UserId = userId,
                SearchTerm = searchTerm,
                OwnerId = ownerId,
                IsPublic = isPublic,
                ChordId = chordId,
                PatternId = patternId,
                ParentSongId = parentSongId,
                MinRating = minRating,
                MaxRating = maxRating,
                CreatedFrom = createdFrom,
                CreatedTo = createdTo,
                SortBy = sortBy,
                SortOrder = sortOrder,
                Page = page,
                PageSize = pageSize
            };

            var query = new SearchSongsQuery(filters);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FullSongDto>> GetSongById(
        Guid id,
        [FromQuery] Guid userId,
        [FromQuery] bool includeStructure = false,
        [FromQuery] bool includeChords = false,
        [FromQuery] bool includePatterns = false,
        [FromQuery] bool includeReviews = false,
        [FromQuery] bool includeComments = false)
    {
        try
        {
            var query = new GetSongByIdQuery(
                id,
                userId,
                includeStructure,
                includeChords,
                includePatterns,
                includeReviews,
                includeComments);

            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<PaginatedDto<SongDto>>> GetUserSongs(
        Guid userId,
        [FromQuery] bool includePrivate = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            
            if (userId != currentUserId && includePrivate)
            {
                return Forbid();
            }

            var query = new GetUserSongsQuery(userId, includePrivate, page, pageSize);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("my-songs")]
    public async Task<ActionResult<PaginatedDto<SongDto>>> GetMySongs(
        [FromQuery] bool includePrivate = true,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var userId = GetCurrentUserId();
            var query = new GetUserSongsQuery(userId, includePrivate, page, pageSize);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id}/related")]
    public async Task<ActionResult<List<SongDto>>> GetRelatedSongs(
        Guid id,
        [FromQuery] int limit = 10)
    {
        try
        {
            var query = new GetRelatedSongsQuery(id, limit);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id}/structure")]
    public async Task<ActionResult<SongStructureDto>> GetSongStructure(Guid id)
    {
        try
        {
            var query = new GetSongStructureQuery(id);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id}/statistics")]
    public async Task<ActionResult<SongStatisticsDto>> GetSongStatistics(Guid id)
    {
        try
        {
            var query = new GetSongStatisticsQuery(id);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<SongDto>> CreateSong([FromBody] CreateSongDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new CreateSongCommand(
                userId,

                dto.Title,
                dto.Genre,
                dto.Theme,
                dto.AudioBase64,
                dto.AudioType,
                dto.Artist,
                dto.Description,
                dto.IsPublic,
                dto.ParentSongId);

            var result = await _mediator.Send(command);

            return CreatedAtAction(nameof(GetSongById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("with-segments")]
    public async Task<ActionResult<SongDto>> CreateSongWithSegments([FromBody] CreateSongWithSegmentsDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new CreateSongWithSegmentsCommand(userId, dto);
            var result = await _mediator.Send(command);

            return CreatedAtAction(nameof(GetSongById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("with-segments")]
    public async Task<ActionResult<SongDto>> UpdateSongWithSegments([FromBody] UpdateSongWithSegmentsDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new UpdateSongCommand(userId, dto);
            var result = await _mediator.Send(command);

            return CreatedAtAction(nameof(GetSongById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSong(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new DeleteSongCommand(userId, id);
            await _mediator.Send(command);

            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id}/copy")]
    public async Task<ActionResult<SongDto>> CopySong(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new CopySongCommand(userId, id);
            var result = await _mediator.Send(command);

            return CreatedAtAction(nameof(GetSongById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPatch("{id}/visibility")]
    public async Task<ActionResult<SongDto>> ToggleSongVisibility(
        Guid id,
        [FromBody] ToggleSongVisibilityDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new ToggleSongVisibilityCommand(userId, id, dto.IsPublic);
            var result = await _mediator.Send(command);

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
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
}

