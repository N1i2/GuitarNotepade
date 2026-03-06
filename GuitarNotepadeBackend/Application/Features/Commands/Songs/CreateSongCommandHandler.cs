using Application.DTOs.Song;
using AutoMapper;
using Domain.Common;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Songs;

public class CreateSongCommandHandler : IRequestHandler<CreateSongCommand, SongDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISongService _songService;
    private readonly IWebDavService _webDavService;
    private readonly IMapper _mapper;
    private readonly ILogger<CreateSongCommandHandler> _logger;

    public CreateSongCommandHandler(
        IUnitOfWork unitOfWork,
        ISongService songService,
        IWebDavService webDavService,
        IMapper mapper,
        ILogger<CreateSongCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _songService = songService;
        _webDavService = webDavService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<SongDto> Handle(CreateSongCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(request.UserId));
        }

        if (user.IsBlocked)
        {
            throw new UnauthorizedAccessException("User is blocked");
        }

        return await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            var song = await _songService.CreateSongAsync(
                ownerId: request.UserId,
                title: request.Title,
                isPublic: request.IsPublic,
                genre: request.Genre,
                theme: request.Theme,
                artist: request.Artist,
                description: request.Description,
                parentSongId: request.ParentSongId,
                cancellationToken: cancellationToken);

            string? audioFileName = null;
            string? audioType = null;

            if (!string.IsNullOrEmpty(request.AudioBase64) && !string.IsNullOrEmpty(request.AudioType))
            {
                try
                {
                    var fileExtension = GetFileExtensionFromAudioType(request.AudioType);
                    audioFileName = $"{song.Id}{fileExtension}";

                    var audioStream = ConvertBase64ToStream(request.AudioBase64);

                    audioFileName = await _webDavService.UploadAudioAsync(
                        audioStream,
                        audioFileName,
                        song.Id);

                    audioType = request.AudioType;

                    song.Update(
                        customAudioUrl: audioFileName,
                        customAudioType: audioType);

                    await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);

                    _logger.LogInformation("Audio uploaded successfully for song {SongId}: {FileName}",
                        song.Id, audioFileName);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to upload audio for song {SongId}", song.Id);
                }
            }

            _logger.LogInformation("Song created successfully: {SongId}", song.Id);

            var songWithDetails = await _unitOfWork.Songs.GetByIdAsync(song.Id, cancellationToken);
            return _mapper.Map<SongDto>(songWithDetails);

        }, cancellationToken);
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

    private string GetFileExtensionFromAudioType(string audioType)
    {
        return audioType.ToLowerInvariant() switch
        {
            "audio/mpeg" or "audio/mp3" => ".mp3",
            "audio/wav" => ".wav",
            "audio/ogg" => ".ogg",
            "audio/mp4" or "audio/m4a" => ".m4a",
            "audio/aac" => ".aac",
            "audio/flac" => ".flac",
            "audio/opus" => ".opus",
            _ => ".mp3"
        };
    }
}
