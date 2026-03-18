using Application.DTOs.Generic;
using Application.DTOs.Song;
using Application.Features.Commands.Songs;
using Application.Features.Commands.Chords;
using Application.Features.Commands.StrummingPatterns;
using Application.Features.Queries.Songs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Application.DTOs.Song.Comment;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SongsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SongsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<SongSearchResultDto>> SearchSongs(
        [FromQuery] string? searchTerm = null,
        [FromQuery] Guid? ownerId = null,
        [FromQuery] bool? isPublic = null,
        [FromQuery] Guid? chordId = null,
        [FromQuery] Guid? patternId = null,
        [FromQuery] decimal? minRating = null,
        [FromQuery] decimal? maxRating = null,
        [FromQuery] DateTime? createdFrom = null,
        [FromQuery] DateTime? createdTo = null,
        [FromQuery] string sortBy = "createdAt",
        [FromQuery] string sortOrder = "desc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var currentUserId = TryGetCurrentUserId();

        if (!currentUserId.HasValue)
        {
            isPublic = true;
        }
        else if (!isPublic.HasValue && ownerId.HasValue && ownerId.Value != currentUserId.Value)
        {
            isPublic = true;
        }

        var filters = new SongSearchFilters
        {
            UserId = currentUserId,
            SearchTerm = searchTerm,
            OwnerId = ownerId,
            IsPublic = isPublic,
            ChordId = chordId,
            PatternId = patternId,
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

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<FullSongDto>> GetSongById(
        Guid id,
        [FromQuery] bool includeStructure = false,
        [FromQuery] bool includeChords = false,
        [FromQuery] bool includePatterns = false,
        [FromQuery] bool includeReviews = false,
        [FromQuery] bool includeComments = false)
    {
        try
        {
            var currentUserId = TryGetCurrentUserId();

            var query = new GetSongByIdQuery(
                id,
                currentUserId,
                includeStructure,
                includeChords,
                includePatterns,
                includeReviews,
                includeComments);

            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Song not found" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpGet("user/{userId}")]
    [AllowAnonymous]
    public async Task<ActionResult<PaginatedDto<SongDto>>> GetUserSongs(
        Guid userId,
        [FromQuery] bool includePrivate = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var currentUserId = TryGetCurrentUserId();

            if (includePrivate)
            {
                if (!currentUserId.HasValue)
                {
                    return Unauthorized(new { error = "Authentication required to view private songs" });
                }

                if (userId != currentUserId.Value)
                {
                    return Forbid();
                }
            }

            var query = new GetUserSongsQuery(userId, includePrivate, page, pageSize);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (ArgumentException)
        {
            return NotFound(new { error = "User not found" });
        }
    }

    [HttpGet("my-songs")]
    [Authorize]
    public async Task<ActionResult<PaginatedDto<SongDto>>> GetMySongs(
        [FromQuery] bool includePrivate = true,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = GetCurrentUserId();
        var query = new GetUserSongsQuery(userId, includePrivate, page, pageSize);
        var result = await _mediator.Send(query);

        return Ok(result);
    }

    [HttpPost]
    [Authorize]
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
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<SongDto>> UpdateSong(
        Guid id,
        [FromBody] UpdateSongDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var command = new UpdateSongCommand(id, userId, userRole, dto);
            var result = await _mediator.Send(command);

            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Song not found" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpDelete("{id}")]
    [Authorize]
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
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Song not found" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost("{id}/structure")]
    [Authorize]
    public async Task<ActionResult<SongStructureDto>> BuildSongStructure(
        Guid id,
        [FromBody] BuildSongStructureRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var command = new BuildSongStructureCommand(
                userId,
                id,
                request.Segments,
                request.RepeatGroups);

            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Song not found" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id}/structure")]
    [AllowAnonymous]
    public async Task<ActionResult<SongStructureDto>> GetSongStructure(Guid id)
    {
        try
        {
            var userId = TryGetCurrentUserId();
            var query = new GetSongStructureQuery(id, userId);
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Song structure not found" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost("{id}/chords/{chordId}")]
    [Authorize]
    public async Task<ActionResult> AddChordToSong(Guid id, Guid chordId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var command = new AddChordToSongCommand(userId, id, chordId);
            await _mediator.Send(command);
            return Ok(new { message = "Chord added to song successfully" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpDelete("{id}/chords/{chordId}")]
    [Authorize]
    public async Task<ActionResult> RemoveChordFromSong(Guid id, Guid chordId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var command = new RemoveChordFromSongCommand(userId, id, chordId);
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
    }

    [HttpGet("{id}/chords")]
    [AllowAnonymous]
    public async Task<ActionResult<List<SongChordDto>>> GetSongChords(Guid id)
    {
        try
        {
            var userId = TryGetCurrentUserId();
            var query = new GetSongChordsQuery(id, userId);
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Song not found" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost("{id}/patterns/{patternId}")]
    [Authorize]
    public async Task<ActionResult> AddPatternToSong(Guid id, Guid patternId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var command = new AddPatternToSongCommand(userId, id, patternId);
            await _mediator.Send(command);
            return Ok(new { message = "Pattern added to song successfully" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpDelete("{id}/patterns/{patternId}")]
    [Authorize]
    public async Task<ActionResult> RemovePatternFromSong(Guid id, Guid patternId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var command = new RemovePatternFromSongCommand(userId, id, patternId);
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
    }

    [HttpGet("{id}/patterns")]
    [AllowAnonymous]
    public async Task<ActionResult<List<SongPatternDto>>> GetSongPatterns(Guid id)
    {
        try
        {
            var userId = TryGetCurrentUserId();
            var query = new GetSongPatternsQuery(id, userId);
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Song not found" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost("{id}/comments")]
    [Authorize]
    public async Task<ActionResult<SongCommentDto>> AddComment(
        Guid id,
        [FromBody] CreateCommentDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var command = new AddCommentCommand(userId, id, dto.Text, dto.SegmentId);
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
    }

    [HttpDelete("{id}/comments")]
    [Authorize]
    public async Task<ActionResult> DeleteComment(
        Guid id,
        [FromQuery] Guid? segmetId = null)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new DeleteCommentCommand(userId, id, segmetId);

            await _mediator.Send(command);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id}/comments")]
    [AllowAnonymous]
    public async Task<ActionResult<List<SongCommentDto>>> GetSongComments(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var userId = TryGetCurrentUserId();
            var query = new GetSongCommentsQuery(id, userId, page, pageSize);
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Song not found" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpGet("count-of-create")]
    [Authorize]
    public async Task<int> CountOfCreateSong()
    {
        var userId = GetCurrentUserId();

        var command = new CountOfCreateSongCommand(userId);

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

    private Guid? TryGetCurrentUserId()
    {
        if (User.Identity?.IsAuthenticated != true)
            return null;

        try
        {
            return GetCurrentUserId();
        }
        catch
        {
            return null;
        }
    }

    private string GetCurrentUserRole()
    {
        var roleClaim = User.FindFirst(ClaimTypes.Role)
                       ?? User.FindFirst("role");

        return roleClaim?.Value ?? "User";
    }
}
