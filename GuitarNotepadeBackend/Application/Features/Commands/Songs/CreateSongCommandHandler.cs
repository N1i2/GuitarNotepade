using Application.DTOs.Song;
using AutoMapper;
using Domain.Common;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class CreateSongCommandHandler : IRequestHandler<CreateSongCommand, SongDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IWebDavService _webDavService;

    public CreateSongCommandHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IWebDavService webDavService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _webDavService = webDavService;
    }

    public async Task<SongDto> Handle(CreateSongCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(request.UserId));
        }

        string? audioUrl = null;
        string? audioType = null;

        if (!string.IsNullOrEmpty(request.AudioBase64))
        {
            if (request.AudioType == Constants.AudioTypes.UrlType)
            {
                audioUrl = request.AudioBase64;
                audioType = Constants.AudioTypes.UrlType;
            }
            else if (request.AudioType == Constants.AudioTypes.FileType)
            {
                try
                {
                    var fileExtension = GetAudioFileExtensionFromBase64(request.AudioBase64);
                    var fileName = $"audio_{Guid.NewGuid():N}{fileExtension}";

                    var cleanBase64 = CleanBase64String(request.AudioBase64);

                    var audioBytes = Convert.FromBase64String(cleanBase64);
                    using var stream = new MemoryStream(audioBytes);

                    audioUrl = await _webDavService.UploadAudioAsync(stream, fileName, request.UserId);
                    audioType = Constants.AudioTypes.FileType;

                    Console.WriteLine($"Audio uploaded to Yandex.Disk: {audioUrl}");
                }
                catch (FormatException ex)
                {
                    Console.WriteLine($"Invalid base64 format: {ex.Message}");
                    throw new Exception("Invalid audio format");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error uploading audio: {ex.Message}");
                    throw new Exception($"Error uploading audio: {ex.Message}");
                }
            }
        }

        if (request.ParentSongId.HasValue)
        {
            var parentSong = await _unitOfWork.Songs.GetByIdAsync(request.ParentSongId.Value, cancellationToken);
            if (parentSong == null || !parentSong.IsPublic)
                throw new ArgumentException("Parent song not found or not public", nameof(request.ParentSongId));
        }

        var song = Domain.Entities.Song.Create(
            request.UserId,
            request.Title,
            request.IsPublic,
            request.Gener,
            request.Theme,
            request.Artist,
            request.Description,
            audioUrl,
            audioType,
            request.ParentSongId);

        await _unitOfWork.Songs.CreateAsync(song, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var fullSong = await _unitOfWork.Songs.GetQueryable()
            .Include(s => s.Owner)
            .Include(s => s.ParentSong)
            .Include(s => s.Structure)
            .Include(s => s.SongChords)
                .ThenInclude(sc => sc.Chord)
            .Include(s => s.SongPatterns)
                .ThenInclude(sp => sp.StrummingPattern)
            .FirstOrDefaultAsync(s => s.Id == song.Id, cancellationToken);

        return _mapper.Map<SongDto>(fullSong);
    }

    private string CleanBase64String(string base64)
    {
        if (base64.Contains("data:") && base64.Contains("base64,"))
        {
            var parts = base64.Split(',');
            if (parts.Length == 2)
            {
                return parts[1];
            }
        }
        return base64;
    }

    private string GetAudioFileExtensionFromBase64(string base64)
    {
        if (base64.StartsWith("data:audio/mpeg;base64,") || base64.StartsWith("data:audio/mp3;base64,"))
        {
            return ".mp3";
        }
        else if (base64.StartsWith("data:audio/wav;base64,"))
        {
            return ".wav";
        }
        else if (base64.StartsWith("data:audio/ogg;base64,"))
        {
            return ".ogg";
        }
        else if (base64.StartsWith("data:audio/mp4;base64,") || base64.StartsWith("data:audio/m4a;base64,"))
        {
            return ".m4a";
        }
        else if (base64.StartsWith("data:audio/aac;base64,"))
        {
            return ".aac";
        }
        else if (base64.StartsWith("data:audio/flac;base64,"))
        {
            return ".flac";
        }
        else if (base64.StartsWith("data:audio/opus;base64,"))
        {
            return ".opus";
        }
        else
        {
            return ".mp3";
        }
    }
}