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

        if (!string.IsNullOrEmpty(request.Dto.AudioBase64) && !string.IsNullOrEmpty(request.Dto.AudioType))
        {
            try
            {
                if (!string.IsNullOrEmpty(song.CustomAudioUrl))
                {
                    await _webDavService.DeleteAudioAsync(song.CustomAudioUrl);
                }

                var audioStream = ConvertBase64ToStream(request.Dto.AudioBase64);
                var fileName = GetFileNameFromAudioType(request.Dto.AudioType);

                audioUrl = await _webDavService.UploadAudioAsync(audioStream, fileName, song.Id);
                audioType = request.Dto.AudioType;

                _logger.LogInformation("Audio updated successfully for song {SongId}: {FileName}", song.Id, audioUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update audio for song {SongId}", song.Id);
                throw new Exception($"Failed to update audio: {ex.Message}", ex);
            }
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

        if (!string.IsNullOrEmpty(audioUrl) && audioUrl != song.CustomAudioUrl)
        {
            song.Update(
                customAudioUrl: audioUrl,
                customAudioType: audioType);
            await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updatedSong = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (updatedSong == null)
        {
            throw new KeyNotFoundException("Song not found after update");
        }

        _logger.LogInformation("Song updated successfully: {SongId}", request.SongId);

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
            _ => "audio.mp3"
        };
    }
}
