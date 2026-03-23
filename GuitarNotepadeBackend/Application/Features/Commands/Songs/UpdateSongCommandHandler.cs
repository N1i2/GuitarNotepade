using Application.DTOs.Song;
using AutoMapper;
using Domain.Common;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Songs;

public class UpdateSongCommandHandler : IRequestHandler<UpdateSongCommand, SongDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISongService _songService;
    private readonly IWebDavService _webDavService;
    private readonly IMapper _mapper;
    private readonly ILogger<UpdateSongCommandHandler> _logger;

    public UpdateSongCommandHandler(
        IUnitOfWork unitOfWork,
        ISongService songService,
        IWebDavService webDavService,
        IMapper mapper,
        ILogger<UpdateSongCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _songService = songService;
        _webDavService = webDavService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<SongDto> Handle(UpdateSongCommand request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
        {
            throw new KeyNotFoundException("Song not found");
        }

        if (song.OwnerId != request.UserId && request.UserRole != Constants.Roles.Admin)
        {
            throw new UnauthorizedAccessException("You do not have permission to update this song");
        }

        string? audioUrl = song.CustomAudioUrl;
        string? audioType = song.CustomAudioType;
        bool audioChanged = false;
        string? oldAudioUrl = song.CustomAudioUrl;

        if (!string.IsNullOrEmpty(request.Dto.AudioBase64) && !string.IsNullOrEmpty(request.Dto.AudioType))
        {
            _logger.LogInformation("Updating audio for song {SongId} with new file", song.Id);

            try
            {
                if (!string.IsNullOrEmpty(song.CustomAudioUrl))
                {
                    await _webDavService.DeleteAudioAsync(song.CustomAudioUrl);
                    _logger.LogInformation("Deleted old audio file: {OldUrl}", song.CustomAudioUrl);
                }

                var audioStream = ConvertBase64ToStream(request.Dto.AudioBase64);
                var fileName = GetFileNameFromAudioType(request.Dto.AudioType);

                audioUrl = await _webDavService.UploadAudioAsync(audioStream, fileName, song.Id);
                audioType = request.Dto.AudioType;
                audioChanged = true;

                _logger.LogInformation("Audio uploaded successfully for song {SongId}: {FileName}", song.Id, audioUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update audio for song {SongId}", song.Id);
                throw new Exception($"Failed to update audio: {ex.Message}", ex);
            }
        }
        else if (request.Dto.IsDeleteAudio == true)
        {
            _logger.LogInformation("Deleting audio for song {SongId}", song.Id);

            try
            {
                if (!string.IsNullOrEmpty(song.CustomAudioUrl))
                {
                    await _webDavService.DeleteAudioAsync(song.CustomAudioUrl);
                    _logger.LogInformation("Deleted audio file: {OldUrl}", song.CustomAudioUrl);
                }

                audioUrl = null;
                audioType = null;
                audioChanged = true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete audio for song {SongId}", song.Id);
                throw new Exception($"Failed to delete audio: {ex.Message}", ex);
            }
        }
        else if (!string.IsNullOrEmpty(request.Dto.CustomAudioUrl))
        {
            _logger.LogInformation("Setting external audio URL for song {SongId}: {Url}", song.Id, request.Dto.CustomAudioUrl);

            if (!string.IsNullOrEmpty(song.CustomAudioUrl) &&
                song.CustomAudioType != "url" &&
                !song.CustomAudioUrl.StartsWith("http"))
            {
                try
                {
                    await _webDavService.DeleteAudioAsync(song.CustomAudioUrl);
                    _logger.LogInformation("Deleted old audio file: {OldUrl}", song.CustomAudioUrl);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete old audio file: {OldUrl}", song.CustomAudioUrl);
                }
            }

            audioUrl = request.Dto.CustomAudioUrl;
            audioType = request.Dto.CustomAudioType ?? "url";
            audioChanged = true;
        }

        await _songService.UpdateSongAsync(
            songId: request.SongId,
            title: request.Dto.Title,
            genre: request.Dto.Genre,
            theme: request.Dto.Theme,
            artist: request.Dto.Artist,
            description: request.Dto.Description,
            isPublic: request.Dto.IsPublic,
            cancellationToken: cancellationToken);

        if (audioChanged)
        {
            _logger.LogInformation("Updating audio in database for song {SongId}. AudioUrl: {AudioUrl}",
                song.Id, audioUrl ?? "null");

            if (audioUrl == null && audioType == null)
            {
                song.CleanAudio();
            }
            else
            {
                song.Update(
                    customAudioUrl: audioUrl,
                    customAudioType: audioType);
            }
            await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (request.Dto.IsDeleteAudio == true)
        {
            var verifySong = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
            _logger.LogInformation("Verification after delete - Song {SongId} audio: {AudioUrl}",
                verifySong?.Id, verifySong?.CustomAudioUrl ?? "null");
        }

        var updatedSong = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (updatedSong == null)
        {
            throw new KeyNotFoundException("Song not found after update");
        }

        _logger.LogInformation("Song updated successfully: {SongId}. Audio: {AudioUrl}",
            request.SongId, updatedSong.CustomAudioUrl ?? "null");

        return _mapper.Map<SongDto>(updatedSong);
    }

    private Stream ConvertBase64ToStream(string base64String)
    {
        if (string.IsNullOrEmpty(base64String))
        {
            throw new ArgumentException("Base64 string cannot be empty", nameof(base64String));
        }

        string cleanBase64 = base64String;
        if (base64String.Contains("data:") && base64String.Contains("base64,"))
        {
            var parts = base64String.Split(',');
            if (parts.Length > 1)
            {
                cleanBase64 = parts[1];
            }
        }

        var bytes = Convert.FromBase64String(cleanBase64);
        return new MemoryStream(bytes);
    }

    private string GetFileNameFromAudioType(string audioType)
    {
        return audioType.ToLowerInvariant() switch
        {
            "audio/mpeg" or "audio/mp3" => "audio.mp3",
            "audio/wav" => "audio.wav",
            "audio/ogg" => "audio.ogg",
            "audio/mp4" or "audio/m4a" => "audio.m4a",
            "audio/aac" => "audio.aac",
            "audio/flac" => "audio.flac",
            "audio/opus" => "audio.opus",
            "audio/webm" => "audio.webm",
            _ => "audio.mp3"
        };
    }
}