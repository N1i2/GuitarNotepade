using Application.DTOs.Song;
using AutoMapper;
using Domain.Common;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Commands.Songs;

public class UpdateSongCommandHandler : IRequestHandler<UpdateSongCommand, SongDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IWebDavService _webDavService;

    public UpdateSongCommandHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IWebDavService webDavService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _webDavService = webDavService;
    }

    public async Task<SongDto> Handle(UpdateSongCommand request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
        {
            throw new ArgumentException("Song not found", nameof(request.SongId));
        }

        if (song.OwnerId != request.UserId)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);
            if (user?.Role != Constants.Roles.Admin)
                throw new UnauthorizedAccessException("Only owner or admin can update song");
        }

        string? newAudioUrl = null;
        string? newAudioType = null;
        var oldAudioFileName = song.CustomAudioUrl;

        bool audioWasProvided = !string.IsNullOrEmpty(request.AudioBase64);

        if (audioWasProvided)
        {
            if (string.IsNullOrEmpty(request.AudioBase64))
            {
                if (!string.IsNullOrEmpty(oldAudioFileName))
                {
                    try
                    {
                        await _webDavService.DeleteAudioAsync(oldAudioFileName);
                        Console.WriteLine($"Audio deleted from Yandex.Disk: {oldAudioFileName}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error deleting audio from Yandex: {ex.Message}");
                    }
                }
                newAudioUrl = null;
                newAudioType = null;
                Console.WriteLine("Audio marked for deletion (null/empty string provided)");
            }
            else if (request.AudioType == Constants.AudioTypes.UrlType)
            {
                newAudioUrl = request.AudioBase64;
                newAudioType = Constants.AudioTypes.UrlType;

                if (!string.IsNullOrEmpty(oldAudioFileName) &&
                    !oldAudioFileName.StartsWith("http://") &&
                    !oldAudioFileName.StartsWith("https://"))
                {
                    try
                    {
                        await _webDavService.DeleteAudioAsync(oldAudioFileName);
                        Console.WriteLine($"Old audio file deleted: {oldAudioFileName}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error deleting old audio file: {ex.Message}");
                    }
                }
            }
            else if (request.AudioType == Constants.AudioTypes.FileType)
            {
                if (request.AudioBase64.StartsWith("data:"))
                {
                    if (!string.IsNullOrEmpty(oldAudioFileName))
                    {
                        try
                        {
                            await _webDavService.DeleteAudioAsync(oldAudioFileName);
                            Console.WriteLine($"Old audio file deleted: {oldAudioFileName}");
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error deleting old audio file: {ex.Message}");
                        }
                    }

                    try
                    {
                        var fileExtension = GetAudioFileExtensionFromBase64(request.AudioBase64);
                        var fileName = $"audio_{Guid.NewGuid():N}{fileExtension}";

                        var cleanBase64 = CleanBase64String(request.AudioBase64);

                        var audioBytes = Convert.FromBase64String(cleanBase64);
                        using var stream = new MemoryStream(audioBytes);

                        newAudioUrl = await _webDavService.UploadAudioAsync(stream, fileName, request.UserId);
                        newAudioType = Constants.AudioTypes.FileType;

                        Console.WriteLine($"New audio uploaded to Yandex.Disk: {newAudioUrl}");
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
                else
                {
                    var fileExists = await _webDavService.AudioExistsAsync(request.AudioBase64);
                    if (fileExists)
                    {
                        newAudioUrl = request.AudioBase64;
                        newAudioType = Constants.AudioTypes.FileType;

                        if (!string.IsNullOrEmpty(oldAudioFileName) &&
                            oldAudioFileName != newAudioUrl &&
                            !oldAudioFileName.StartsWith("http://") &&
                            !oldAudioFileName.StartsWith("https://"))
                        {
                            try
                            {
                                await _webDavService.DeleteAudioAsync(oldAudioFileName);
                                Console.WriteLine($"Old audio file deleted: {oldAudioFileName}");
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Error deleting old audio file: {ex.Message}");
                            }
                        }
                    }
                }
            }
        }

        song.Update(
            title: request.Title,
            artist: request.Artist,
            genre: request.Genre,
            theme: request.Theme,
            description: request.Description,
            customAudioUrl: audioWasProvided ? newAudioUrl : null,
            customAudioType: audioWasProvided ? newAudioType : null,
            isPublic: request.IsPublic);

        await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updatedSong = await _unitOfWork.Songs.GetQueryable()
            .Include(s => s.Owner)
            .Include(s => s.ParentSong)
            .Include(s => s.Structure)
            .Include(s => s.SongChords)
                .ThenInclude(sc => sc.Chord)
            .Include(s => s.SongPatterns)
                .ThenInclude(sp => sp.StrummingPattern)
            .Include(s => s.Reviews)
            .Include(s => s.Comments)
            .FirstOrDefaultAsync(s => s.Id == song.Id, cancellationToken);

        return _mapper.Map<SongDto>(updatedSong);
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
        if (base64.StartsWith("data:audio/mpeg;base64,") ||
            base64.StartsWith("data:audio/mp3;base64,") ||
            base64.StartsWith("data:audio/mpga;base64,"))
        {
            return ".mp3";
        }
        else if (base64.StartsWith("data:audio/wav;base64,") ||
                 base64.StartsWith("data:audio/x-wav;base64,") ||
                 base64.StartsWith("data:audio/vnd.wave;base64,"))
        {
            return ".wav";
        }
        else if (base64.StartsWith("data:audio/ogg;base64,"))
        {
            return ".ogg";
        }
        else if (base64.StartsWith("data:audio/mp4;base64,") ||
                 base64.StartsWith("data:audio/m4a;base64,") ||
                 base64.StartsWith("data:audio/x-m4a;base64,"))
        {
            return ".m4a";
        }
        else if (base64.StartsWith("data:audio/aac;base64,"))
        {
            return ".aac";
        }
        else if (base64.StartsWith("data:audio/flac;base64,") ||
                 base64.StartsWith("data:audio/x-flac;base64,"))
        {
            return ".flac";
        }
        else if (base64.StartsWith("data:audio/opus;base64,"))
        {
            return ".opus";
        }
        else if (base64.StartsWith("data:audio/webm;base64,"))
        {
            return ".webm";
        }
        else
        {
            return ".mp3";
        }
    }
}