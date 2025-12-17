using Application.DTOs.Generic;
using Application.DTOs.Songs;
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
    [AllowAnonymous]
    public async Task<ActionResult<PaginatedDto<SongDto>>> GetAllSongs(
        [FromQuery] string? search = null,
        [FromQuery] string? title = null,
        [FromQuery] string? artist = null,
        [FromQuery] bool? isPublic = null,
        [FromQuery] Guid? chordId = null,
        [FromQuery] Guid? patternId = null,
        [FromQuery] bool? mySongsOnly = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "createdAt",
        [FromQuery] string sortOrder = "desc")
    {
        try
        {
            var userId = GetCurrentUserIdIfAuthenticated();

            var filters = new SongFiltersDto
            {
                Search = search,
                Title = title,
                Artist = artist,
                IsPublic = isPublic,
                ChordId = chordId,
                PatternId = patternId,
                MySongsOnly = mySongsOnly,
                OwnerId = mySongsOnly.GetValueOrDefault() ? userId : null,
                Page = page,
                PageSize = pageSize,
                SortBy = sortBy,
                SortOrder = sortOrder
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
    public async Task<ActionResult<SongDto>> GetSongById(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var query = new GetSongByIdQuery(id, userId);
            var result = await _mediator.Send(query);

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
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("user/{userId}")]
    [AllowAnonymous]
    public async Task<ActionResult<PaginatedDto<SongDto>>> GetUserSongs(
        Guid userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "createdAt",
        [FromQuery] string sortOrder = "desc")
    {
        try
        {
            var currentUserId = GetCurrentUserIdIfAuthenticated();
            var isOwner = currentUserId.HasValue && currentUserId.Value == userId;

            var filters = new SongFiltersDto
            {
                OwnerId = userId,
                IsPublic = isOwner ? null : true,
                Page = page,
                PageSize = pageSize,
                SortBy = sortBy,
                SortOrder = sortOrder
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

    [HttpPost]
    public async Task<ActionResult<SongDto>> CreateSong([FromBody] CreateSongRequestDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new CreateSongCommand(
                title: dto.Title,
                artist: dto.Artist,
                isPublic: dto.IsPublic,
                ownerId: userId,
                parentSongId: dto.ParentSongId,
                structure: _mapper.Map<Domain.Entities.HelpEntitys.SongStructure>(dto.Structure),
                chordIds: dto.ChordIds,
                patternIds: dto.PatternIds);

            var result = await _mediator.Send(command);

            return CreatedAtAction(nameof(GetSongById), new { id = result.Id }, result);
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

    [HttpPut("{id}")]
    public async Task<ActionResult<SongDto>> UpdateSong(Guid id, [FromBody] UpdateSongRequestDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new UpdateSongCommand(
                songId: id,
                userId: userId,
                title: dto.Title,
                artist: dto.Artist,
                isPublic: dto.IsPublic,
                structure: _mapper.Map<Domain.Entities.HelpEntitys.SongStructure>(dto.Structure),
                chordIds: dto.ChordIds,
                patternIds: dto.PatternIds);

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
    public async Task<ActionResult> DeleteSong(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var command = new DeleteSongCommand(id, userId, userRole);
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
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPatch("{id}/toggle-visibility")]
    public async Task<ActionResult<SongDto>> ToggleSongVisibility(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();

            var song = await _mediator.Send(new GetSongByIdQuery(id, userId));

            var command = new UpdateSongCommand(
                songId: id,
                userId: userId,
                isPublic: !song.IsPublic);

            var result = await _mediator.Send(command);

            return Ok(new
            {
                message = $"Song is now {(result.IsPublic ? "public" : "private")}",
                song = result
            });
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

    [HttpGet("{id}/fork")]
    public async Task<ActionResult<SongDto>> ForkSong(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();

            var originalSong = await _mediator.Send(new GetSongByIdQuery(id, null));

            var createDto = new CreateSongRequestDto
            {
                Title = $"{originalSong.Title} (Fork)",
                Artist = originalSong.Artist,
                IsPublic = true,
                ParentSongId = originalSong.Id,
                Structure = originalSong.Structure,
                ChordIds = originalSong.ChordIds,
                PatternIds = originalSong.PatternIds
            };

            var command = new CreateSongCommand(
                title: createDto.Title,
                artist: createDto.Artist,
                isPublic: createDto.IsPublic,
                ownerId: userId,
                parentSongId: createDto.ParentSongId,
                structure: _mapper.Map<Domain.Entities.HelpEntitys.SongStructure>(createDto.Structure),
                chordIds: createDto.ChordIds,
                patternIds: createDto.PatternIds);

            var result = await _mediator.Send(command);

            return CreatedAtAction(nameof(GetSongById), new { id = result.Id }, result);
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

    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<ActionResult<PaginatedDto<SongDto>>> SearchSongs(
        [FromQuery] string? q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var filters = new SongFiltersDto
            {
                Search = q,
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

    [HttpGet("{id}/chords")]
    [AllowAnonymous]
    public async Task<ActionResult<List<Guid>>> GetSongChords(Guid id)
    {
        try
        {
            var userId = GetCurrentUserIdIfAuthenticated();
            var query = new GetSongByIdQuery(id, userId);
            var song = await _mediator.Send(query);

            return Ok(song.ChordIds);
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

    [HttpGet("{id}/patterns")]
    [AllowAnonymous]
    public async Task<ActionResult<List<Guid>>> GetSongPatterns(Guid id)
    {
        try
        {
            var userId = GetCurrentUserIdIfAuthenticated();
            var query = new GetSongByIdQuery(id, userId);
            var song = await _mediator.Send(query);

            return Ok(song.PatternIds);
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

    private Guid? GetCurrentUserIdIfAuthenticated()
    {
        if (!User.Identity?.IsAuthenticated ?? true)
        {
            return null;
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                         ?? User.FindFirst("sub")
                         ?? User.FindFirst("userId");

        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return userId;
        }

        return null;
    }

    private string GetCurrentUserRole()
    {
        var roleClaim = User.FindFirst(ClaimTypes.Role)
                       ?? User.FindFirst("role");

        return roleClaim?.Value ?? "User";
    }
}