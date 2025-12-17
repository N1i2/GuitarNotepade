using Application.DTOs.Generic;
using Application.DTOs.Reviews;
using Application.Features.Commands.Reviews;
using Application.Features.Queries.Reviews;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SongReviewsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IMapper _mapper;

    public SongReviewsController(IMediator mediator, IMapper mapper)
    {
        _mediator = mediator;
        _mapper = mapper;
    }

    [HttpGet("song/{songId}")]
    [AllowAnonymous]
    public async Task<ActionResult<PaginatedDto<SongReviewDto>>> GetSongReviews(
        Guid songId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "createdAt",
        [FromQuery] string sortOrder = "desc")
    {
        try
        {
            var query = new GetSongReviewsQuery(songId, page, pageSize, sortBy, sortOrder);
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

    [HttpGet("user/{userId}")]
    [AllowAnonymous]
    public async Task<ActionResult<PaginatedDto<SongReviewDto>>> GetUserReviews(
        Guid userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var query = new GetUserReviewsQuery(userId, page, pageSize);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("my-reviews")]
    public async Task<ActionResult<PaginatedDto<SongReviewDto>>> GetMyReviews(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var userId = GetCurrentUserId();
            var query = new GetUserReviewsQuery(userId, page, pageSize);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<SongReviewDto>> GetReviewById(Guid id)
    {
        try
        {
            var query = new GetReviewByIdQuery(id);
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

    [HttpPost("song/{songId}")]
    public async Task<ActionResult<SongReviewDto>> CreateReview(
        Guid songId,
        [FromBody] CreateReviewRequestDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new CreateReviewCommand(
                songId: songId,
                userId: userId,
                reviewText: dto.ReviewText,
                beautifulLevel: dto.BeautifulLevel,
                difficultyLevel: dto.DifficultyLevel);

            var result = await _mediator.Send(command);

            return CreatedAtAction(nameof(GetReviewById), new { id = result.Id }, result);
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
    public async Task<ActionResult<SongReviewDto>> UpdateReview(
        Guid id,
        [FromBody] UpdateReviewRequestDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new UpdateReviewCommand(
                reviewId: id,
                userId: userId,
                reviewText: dto.ReviewText,
                beautifulLevel: dto.BeautifulLevel,
                difficultyLevel: dto.DifficultyLevel);

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
            var userRole = GetCurrentUserRole();

            var command = new DeleteReviewCommand(id, userId, userRole);
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

    [HttpPost("{id}/like")]
    public async Task<ActionResult> LikeReview(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new ToggleReviewLikeCommand(id, userId, true);
            await _mediator.Send(command);

            return Ok(new { message = "Review liked successfully" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
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

    [HttpPost("{id}/dislike")]
    public async Task<ActionResult> DislikeReview(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();

            var command = new ToggleReviewLikeCommand(id, userId, false);
            await _mediator.Send(command);

            return Ok(new { message = "Review disliked successfully" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
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

    [HttpDelete("{id}/reaction")]
    public async Task<ActionResult> RemoveReaction(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();

            var review = await _mediator.Send(new GetReviewByIdQuery(id));
            var hasReaction = review.UserLiked.HasValue;

            if (!hasReaction)
            {
                return Ok(new { message = "No reaction to remove" });
            }

            if (review.UserLiked == null)
            {
                throw new Exception("User liked is null");
            }

            var command = new ToggleReviewLikeCommand(
                id,
                userId,
                review.UserLiked.Value);
            await _mediator.Send(command);

            return Ok(new { message = "Reaction removed successfully" });
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

    [HttpGet("song/{songId}/my-review")]
    public async Task<ActionResult<SongReviewDto>> GetMyReviewForSong(Guid songId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var query = new GetReviewBySongAndUserQuery(songId, userId);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("stats/song/{songId}")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> GetSongReviewStats(Guid songId)
    {
        try
        {
            var query = new GetSongReviewStatsQuery(songId);
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