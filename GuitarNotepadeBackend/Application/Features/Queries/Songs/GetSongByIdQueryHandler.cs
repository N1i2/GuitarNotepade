using Application.DTOs.Song;
using AutoMapper;
using Domain.Common;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Songs;

public class GetSongByIdQueryHandler : IRequestHandler<GetSongByIdQuery, FullSongDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IWebDavService _webDavService;

    public GetSongByIdQueryHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IWebDavService webDavService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _webDavService = webDavService;
    }

    public async Task<FullSongDto> Handle(GetSongByIdQuery request, CancellationToken cancellationToken)
    {
        var query = _unitOfWork.Songs.GetQueryable()
            .Include(s => s.Owner)
            .Include(s => s.ParentSong)
            .Include(s => s.Structure)
                .ThenInclude(st => st.SegmentPositions)
                    .ThenInclude(sp => sp.Segment)
                        .ThenInclude(seg => seg.Chord)
            .Include(s => s.Structure)
                .ThenInclude(st => st.SegmentPositions)
                    .ThenInclude(sp => sp.Segment)
                        .ThenInclude(seg => seg.Pattern)
            .Include(s => s.Structure)
                .ThenInclude(st => st.SegmentPositions)
                    .ThenInclude(sp => sp.Segment)
                        .ThenInclude(seg => seg.SegmentLabels)
                            .ThenInclude(sl => sl.Label)
            .Include(s => s.SongChords)
                .ThenInclude(sc => sc.Chord)
            .Include(s => s.SongPatterns)
                .ThenInclude(sp => sp.StrummingPattern)
            .Include(s => s.Comments)
            .AsQueryable();

        var song = await query.FirstOrDefaultAsync(s => s.Id == request.SongId, cancellationToken);

        var user = await _unitOfWork.Users.GetByIdAsync(request.UserId);
        if (user == null)
        {
            throw new ArgumentException("User not found", nameof(request.UserId));
        }

        if (song == null)
        {
            throw new ArgumentException("Song not found", nameof(request.SongId));
        }

        if (user.Role != Constants.Roles.Admin && !song.IsPublic && song.OwnerId != request.UserId)
        {
            throw new UnauthorizedAccessException("You don't have permission to access this song");
        }


        var fullSongDto = _mapper.Map<FullSongDto>(song);
        
        if (request.IncludeReviews)
        {
            var reviews = await _unitOfWork.SongReviews.GetBySongIdAsync(request.SongId, cancellationToken);
            fullSongDto.Reviews = reviews.Select(r => _mapper.Map<SongReviewDto>(r)).ToList();
        }

        if (!string.IsNullOrEmpty(song.CustomAudioUrl) && !string.IsNullOrEmpty(song.CustomAudioType))
        {
            try
            {
                if (song.CustomAudioType == Constants.AudioTypes.UrlType)
                {
                    fullSongDto.CustomAudioUrl = song.CustomAudioUrl;
                    fullSongDto.CustomAudioType = Constants.AudioTypes.UrlType;
                }
                else if (song.CustomAudioType == Constants.AudioTypes.FileType)
                {
                    if (song.CustomAudioUrl.StartsWith("http://") || song.CustomAudioUrl.StartsWith("https://"))
                    {
                        fullSongDto.CustomAudioUrl = song.CustomAudioUrl;
                        fullSongDto.CustomAudioType = Constants.AudioTypes.UrlType;
                    }
                    else
                    {
                        try
                        {
                            var audioBytes = await _webDavService.GetAudioBytesAsync(song.CustomAudioUrl);

                            if (audioBytes != null && audioBytes.Length > 0)
                            {
                                var fileExtension = Path.GetExtension(song.CustomAudioUrl).ToLowerInvariant();
                                var mimeType = GetAudioMimeType(fileExtension);

                                var base64String = Convert.ToBase64String(audioBytes);
                                fullSongDto.CustomAudioUrl = $"data:{mimeType};base64,{base64String}";
                                fullSongDto.CustomAudioType = Constants.AudioTypes.FileType;

                                Console.WriteLine($"Audio converted to base64 for song {song.Id}");
                            }
                            else
                            {
                                fullSongDto.CustomAudioUrl = null;
                                fullSongDto.CustomAudioType = null;
                                Console.WriteLine($"Audio file not found or empty: {song.CustomAudioUrl}");
                            }
                        }
                        catch (FileNotFoundException ex)
                        {
                            Console.WriteLine($"Audio file not found on Yandex.Disk: {song.CustomAudioUrl}. Error: {ex.Message}");
                            fullSongDto.CustomAudioUrl = null;
                            fullSongDto.CustomAudioType = null;
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error loading audio file: {song.CustomAudioUrl}. Error: {ex.Message}");
                            fullSongDto.CustomAudioUrl = null;
                            fullSongDto.CustomAudioType = null;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error processing audio for song {song.Id}: {ex.Message}");
                fullSongDto.CustomAudioUrl = null;
                fullSongDto.CustomAudioType = null;
            }
        }

        return fullSongDto;
    }

    private string GetAudioMimeType(string fileExtension)
    {
        return fileExtension.ToLowerInvariant() switch
        {
            ".mp3" => "audio/mpeg",
            ".wav" => "audio/wav",
            ".ogg" => "audio/ogg",
            ".m4a" => "audio/mp4",
            ".aac" => "audio/aac",
            ".flac" => "audio/flac",
            ".opus" => "audio/opus",
            ".webm" => "audio/webm",
            _ => "application/octet-stream"
        };
    }
}