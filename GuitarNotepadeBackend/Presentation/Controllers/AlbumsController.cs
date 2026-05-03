using Application.DTOs.Alboms;
using Application.Features.Commands.Alboms;
using Application.Features.Queries.Alboms;
using Domain.Interfaces.Services;
using Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AlbumsController : ApiControllerBase
{
    private readonly IMediator _mediator;
    private readonly IUserService _userService;

    public AlbumsController(IMediator mediator, IUserService userService)
    {
        _mediator = mediator;
        _userService = userService;
    }

    /// <summary>
    /// A list of all albums with a certain condition
    /// </summary>
    /// <param name="searchTerm">Part of the Title</param>
    /// <param name="ownerId">Who created this albome</param>
    /// <param name="isPublic">true = all public, false = only my and only private</param>
    /// <param name="genre"></param>
    /// <param name="theme"></param>
    /// <param name="sortBy"></param>
    /// <param name="sortOrder"></param>
    /// <param name="page"></param>
    /// <param name="pageSize"></param>
    /// <returns></returns>
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
        var currentUser = await _userService.GetByIdAsync(currentUserId);

        if (currentUser.Role == Constants.Roles.Guest)
        {
            return Ok(new AlbumSearchResultDto { Albums = new List<AlbumDto>() });
        }

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

    /// <summary>
    /// gives an album with a specific ID
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
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

    /// <summary>
    /// gives an album with a specific ID with songs inside them
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [HttpGet("{id}/with-songs")]
    public async Task<ActionResult<AlbumWithSongsDto>> GetAlbumByIdWithSongs(Guid id)
    {
        try
        {
            var query = new GetAlbumByIdWithSongsQuery(id, GetCurrentUserId());
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Album not found" });
        }
    }

    /// <summary>
    /// Gives all albums written by a specific creator
    /// </summary>
    /// <param name="userId">Who created those albume</param>
    /// <param name="includePrivate">only for admin and creator</param>
    /// <param name="page"></param>
    /// <param name="pageSize"></param>
    /// <returns></returns>
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

    /// <summary>
    /// Gives only my albums
    /// </summary>
    /// <param name="includePrivate"></param>
    /// <param name="page"></param>
    /// <param name="pageSize"></param>
    /// <returns></returns>
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

    /// <summary>
    /// Create new album
    /// </summary>
    /// <param name="dto"></param>
    /// <returns></returns>
    [HttpPost]
    public async Task<ActionResult<AlbumDto>> CreateAlbum([FromBody] CreateAlbumDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var user = await _userService.GetByIdAsync(userId);

            if (!user.CanCreateAlbum())
            {
                return Forbid("Only Premium users can create albums. Upgrade to Premium!");
            }

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

    /// <summary>
    /// Update your album (only for creator)
    /// </summary>
    /// <param name="id"></param>
    /// <param name="dto"></param>
    /// <returns></returns>
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

    /// <summary>
    /// Delete an existing album (only for creator and admin)
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
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

    /// <summary>
    /// Add a new, unique song to the album (your own or someone else's public one)
    /// </summary>
    /// <param name="id"></param>
    /// <param name="songId"></param>
    /// <returns></returns>
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

    /// <summary>
    /// Remove a song from your album
    /// </summary>
    /// <param name="id"></param>
    /// <param name="songId"></param>
    /// <returns></returns>
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

    /// <summary>
    /// Each user has one album, display this album
    /// </summary>
    /// <returns></returns>
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

    /// <summary>
    /// Add a song to your favorites album
    /// </summary>
    /// <param name="songId"></param>
    /// <returns></returns>
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

    /// <summary>
    /// Remove a song from your Favorites album
    /// </summary>
    /// <param name="songId"></param>
    /// <returns></returns>
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


    [HttpGet("count-of-create")]
    public async Task<int> CountOfCreateAlbum()
    {
        var userId = GetCurrentUserId();

        var command = new CountOfCreateAlbumCommand(userId);

        return await _mediator.Send(command);
    }
}
