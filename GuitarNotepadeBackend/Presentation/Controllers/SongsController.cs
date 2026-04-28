using Application.DTOs.Generic;
using Application.DTOs.Song;
using Application.DTOs.Song.Comment;
using Application.Features.Commands.Chords;
using Application.Features.Commands.Songs;
using Application.Features.Commands.StrummingPatterns;
using Application.Features.Queries.Songs;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SongsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IWebDavService _webDavService;
    private readonly ILogger<SongsController> _logger;

    public SongsController(
        IMediator mediator,
        IUnitOfWork unitOfWork,
        IWebDavService webDavService,
        ILogger<SongsController> logger)
    {
        _mediator = mediator;
        _unitOfWork = unitOfWork;
        _webDavService = webDavService;
        _logger = logger;
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

    [HttpGet("{id}/audio-file")]
    [AllowAnonymous]
    public async Task<ActionResult> GetAudioFile(
    Guid id,
    CancellationToken cancellationToken)
    {
        try
        {
            var song = await _unitOfWork.Songs.GetByIdAsync(id, cancellationToken);
            if (song == null)
            {
                return NotFound(new { error = "Song not found" });
            }

            var currentUserId = TryGetCurrentUserId();
            if (!song.IsPublic && (!currentUserId.HasValue || song.OwnerId != currentUserId.Value))
            {
                return Forbid();
            }

            if (song.CustomAudioUrl?.StartsWith("http://") == true ||
                song.CustomAudioUrl?.StartsWith("https://") == true)
            {
                return BadRequest(new { error = "This is an external URL, not a file" });
            }

            if (string.IsNullOrEmpty(song.CustomAudioUrl))
            {
                return NotFound(new { error = "Audio file not found" });
            }

            var fileStream = await _webDavService.GetAudioStreamAsync(song.CustomAudioUrl);
            if (fileStream == null)
            {
                return NotFound(new { error = "Audio file not found" });
            }

            var mimeType = song.CustomAudioType switch
            {
                "audio/mpeg" => "audio/mpeg",
                "audio/webm" => "audio/webm",
                "audio/wav" => "audio/wav",
                "audio/ogg" => "audio/ogg",
                "audio/mp4" => "audio/mp4",
                _ => "audio/mpeg"
            };

            var fileName = Path.GetFileName(song.CustomAudioUrl);

            Response.Headers.Append("Content-Disposition", $"inline; filename=\"{fileName}\"");
            Response.Headers.Append("Accept-Ranges", "bytes");

            return File(fileStream, mimeType, fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audio file for song {SongId}", id);
            return StatusCode(500, new { error = "Failed to get audio file" });
        }
    }

    [HttpGet("{id}/audio-url")]
    [AllowAnonymous]
    public async Task<ActionResult> GetAudioUrl(
    Guid id,
    [FromQuery] string fileName,
    CancellationToken cancellationToken)
    {
        try
        {
            var song = await _unitOfWork.Songs.GetByIdAsync(id, cancellationToken);
            if (song == null)
            {
                return NotFound(new { error = "Song not found" });
            }

            var currentUserId = TryGetCurrentUserId();
            if (!song.IsPublic && (!currentUserId.HasValue || song.OwnerId != currentUserId.Value))
            {
                return Forbid();
            }

            if (fileName.StartsWith("http://") || fileName.StartsWith("https://") || fileName.StartsWith("data:"))
            {
                return Ok(new { url = fileName });
            }

            var audioUrl = await _webDavService.GetAudioUrlAsync(fileName);

            if (string.IsNullOrEmpty(audioUrl))
            {
                return NotFound(new { error = "Audio file not found" });
            }

            return Ok(new { url = audioUrl });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audio URL for song {SongId}", id);
            return StatusCode(500, new { error = "Failed to get audio URL" });
        }
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
                dto.ParentSongId,
                dto.CustomAudioUrl,
                dto.CustomAudioType);

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
                request.RepeatGroups,
                request.SegmentComments);

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

    [HttpPost("{id}/audio")]
    [Authorize]
    [RequestSizeLimit(100_000_000)]
    [DisableRequestSizeLimit]
    public async Task<ActionResult> UploadAudio(
    Guid id,
    IFormFile audioFile,
    CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();

            var song = await _unitOfWork.Songs.GetByIdAsync(id, cancellationToken);
            if (song == null)
            {
                _logger.LogWarning("Song not found: {SongId}", id);
                return NotFound(new { error = "Song not found" });
            }

            if (song.OwnerId != userId)
            {
                _logger.LogWarning("User {UserId} not authorized to upload audio for song {SongId}", userId, id);
                return Forbid();
            }

            if (audioFile == null || audioFile.Length == 0)
            {
                return BadRequest(new { error = "No audio file provided" });
            }

            if (audioFile.Length > 100_000_000)
            {
                return BadRequest(new { error = "File too large. Maximum size is 100MB" });
            }

            var allowedTypes = new[]
            {
            "audio/mpeg",
            "audio/wav",
            "audio/ogg",
            "audio/mp4",
            "audio/aac",
            "audio/flac",
            "audio/opus",
            "audio/webm"
        };

            if (!allowedTypes.Contains(audioFile.ContentType))
            {
                _logger.LogWarning("Unsupported audio type: {ContentType}", audioFile.ContentType);
                return BadRequest(new { error = $"Unsupported audio type: {audioFile.ContentType}. Supported: mp3, wav, ogg, m4a, aac, flac, opus, webm" });
            }

            string fileExtension;
            if (!string.IsNullOrEmpty(Path.GetExtension(audioFile.FileName)))
            {
                fileExtension = Path.GetExtension(audioFile.FileName);
            }
            else
            {
                fileExtension = audioFile.ContentType switch
                {
                    "audio/mpeg" => ".mp3",
                    "audio/wav" => ".wav",
                    "audio/ogg" => ".ogg",
                    "audio/mp4" => ".m4a",
                    "audio/aac" => ".aac",
                    "audio/flac" => ".flac",
                    "audio/opus" => ".opus",
                    "audio/webm" => ".webm",
                    _ => ".mp3"
                };
            }

            var fileName = $"{song.Id}{fileExtension}";

            _logger.LogInformation("Uploading audio for song {SongId}: {FileName}, Size: {Size} bytes, Type: {ContentType}",
                song.Id, fileName, audioFile.Length, audioFile.ContentType);

            using var stream = audioFile.OpenReadStream();
            var uploadedFileName = await _webDavService.UploadAudioAsync(stream, fileName, song.Id);

            song.Update(
                customAudioUrl: uploadedFileName,
                customAudioType: audioFile.ContentType);

            await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Audio uploaded successfully for song {SongId}: {FileName}",
                song.Id, uploadedFileName);

            return Ok(new
            {
                fileName = uploadedFileName,
                audioType = audioFile.ContentType,
                size = audioFile.Length
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading audio for song {SongId}", id);
            return StatusCode(500, new { error = "Failed to upload audio", details = ex.Message });
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
