using Application.DTOs.Alboms;
using Application.Features.Commands.Alboms;
using Application.Features.Queries.Alboms;
using Application.Features.Queries.Albums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AlbumsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AlbumsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<AlbumSearchResultDto>> SearchAlbums(
        [FromQuery] string? searchTerm = null,
        [FromQuery] Guid? ownerId = null,
        [FromQuery] bool? isPublic = null,
        [FromQuery] string? genre = null,
        [FromQuery] string? theme = null,
        [FromQuery] string sortBy = "createdAt",
        [FromQuery] string sortOrder = "desc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var currentUserId = GetCurrentUserId();

        var filters = new AlbumSearchFilters
        {
            UserId = currentUserId,
            SearchTerm = searchTerm,
            OwnerId = ownerId,
            IsPublic = isPublic,
            Genre = genre,
            Theme = theme,
            SortBy = sortBy,
            SortOrder = sortOrder,
            Page = page,
            PageSize = pageSize
        };

        var query = new SearchAlbumsQuery(filters);
        var result = await _mediator.Send(query);

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AlbumDto>> GetAlbumById(Guid id)
    {
        try
        {
            var query = new GetAlbumByIdQuery(id);
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Album not found" });
        }
    }

    [HttpGet("{id}/with-songs")]
    public async Task<ActionResult<AlbumWithSongsDto>> GetAlbumByIdWithSongs(Guid id)
    {
        try
        {
            var query = new GetAlbumByIdWithSongsQuery(id);
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Album not found" });
        }
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<AlbumSearchResultDto>> GetUserAlbums(
        Guid userId,
        [FromQuery] bool includePrivate = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var currentUserId = GetCurrentUserId();

        if (userId != currentUserId && includePrivate)
        {
            return Forbid();
        }

        var filters = new AlbumSearchFilters
        {
            UserId = currentUserId,
            OwnerId = userId,
            IsPublic = includePrivate ? null : true,
            Page = page,
            PageSize = pageSize
        };

        var query = new SearchAlbumsQuery(filters);
        var result = await _mediator.Send(query);

        return Ok(result);
    }

    [HttpGet("my-albums")]
    public async Task<ActionResult<AlbumSearchResultDto>> GetMyAlbums(
        [FromQuery] bool includePrivate = true,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = GetCurrentUserId();
        var filters = new AlbumSearchFilters
        {
            UserId = userId,
            OwnerId = userId,
            IsPublic = includePrivate ? null : true,
            Page = page,
            PageSize = pageSize
        };

        var query = new SearchAlbumsQuery(filters);
        var result = await _mediator.Send(query);

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<AlbumDto>> CreateAlbum([FromBody] CreateAlbumDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new CreateAlbumCommand(
                userId,
                dto.Title,
                dto.IsPublic,
                dto.Genre,
                dto.Theme,
                dto.CoverUrl,
                dto.Description);

            var result = await _mediator.Send(command);

            return CreatedAtAction(nameof(GetAlbumById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AlbumDto>> UpdateAlbum(Guid id, [FromBody] UpdateAlbumDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new UpdateAlbumCommand(
                userId: userId,
                albumId: id,
                title: dto.Title,
                coverBase64: dto.CoverUrl,
                description: dto.Description,
                isPublic: dto.IsPublic,
                genre: dto.Genre,
                theme: dto.Theme);

            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Album not found" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteAlbum(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new DeleteAlbumCommand(userId, id);
            await _mediator.Send(command);

            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Album not found" });
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

    [HttpPost("{id}/songs/{songId}")]
    public async Task<ActionResult> AddSongToAlbum(Guid id, Guid songId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var command = new AddSongToAlbumCommand(userId, id, songId);
            await _mediator.Send(command);
            return Ok(new { message = "Song added to album successfully" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
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

    [HttpDelete("{id}/songs/{songId}")]
    public async Task<ActionResult> RemoveSongFromAlbum(Guid id, Guid songId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var command = new RemoveSongFromAlbumCommand(userId, id, songId);
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

    [HttpGet("favorite")]
    public async Task<ActionResult<AlbumWithSongsDto>> GetFavoriteAlbum()
    {
        try
        {
            var userId = GetCurrentUserId();
            var query = new GetFavoriteAlbumQuery(userId);
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Favorite album not found" });
        }
    }

    [HttpPost("favorite/{songId}")]
    public async Task<ActionResult> AddSongToFavorite(Guid songId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var command = new AddSongToFavoriteCommand(userId, songId);
            await _mediator.Send(command);
            return Ok(new { message = "Song added to favorites successfully" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpDelete("favorite/{songId}")]
    public async Task<ActionResult> RemoveSongFromFavorite(Guid songId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var command = new RemoveSongFromFavoriteCommand(userId, songId);
            await _mediator.Send(command);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
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
