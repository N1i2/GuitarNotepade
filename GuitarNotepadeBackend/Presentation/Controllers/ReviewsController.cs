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
public class ReviewsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IMapper _mapper;

    public ReviewsController(IMediator mediator, IMapper mapper)
    {
        _mediator = mediator;
        _mapper = mapper;
    }

    [HttpPost("songs/{songId}")]
    public async Task<ActionResult<SongReviewDto>> CreateReview(
        Guid songId,
        [FromBody] CreateSongReviewDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new CreateSongReviewCommand(
                userId,
                songId,
                dto.ReviewText,
                dto.BeautifulLevel,
                dto.DifficultyLevel);

            var result = await _mediator.Send(command);

            return CreatedAtAction(nameof(GetReview), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
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

    [HttpGet("{id}")]
    public async Task<ActionResult<SongReviewDto>> GetReview(Guid id)
    {
        try
        {
            var query = new GetSongReviewByIdQuery(id);
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

    [HttpGet("songs/{songId}")]
    public async Task<ActionResult<PaginatedDto<SongReviewDto>>> GetSongReviews(
        Guid songId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "createdAt",
        [FromQuery] bool descending = false)
    {
        try
        {
            var query = new GetSongReviewsQuery(songId, page, pageSize, sortBy, descending);
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

    [HttpPut("{id}")]
    public async Task<ActionResult<SongReviewDto>> UpdateReview(
        Guid id,
        [FromBody] UpdateSongReviewDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new UpdateSongReviewCommand(
                userId,
                id,
                dto.ReviewText,
                dto.BeautifulLevel,
                dto.DifficultyLevel);

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

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteReview(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new DeleteSongReviewCommand(userId, id);
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

