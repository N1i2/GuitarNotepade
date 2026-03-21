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

        if (user.IsFreeUser)
        {
            var userSongsCount = await _unitOfWork.Songs.CountByUserIdAsync(user.Id, cancellationToken);
            if (!user.CanCreateMoreSongs(userSongsCount))
            {
                throw new InvalidOperationException($"Free users can only create up to {Constants.Limits.FreeUserMaxSongs} songs. Upgrade to Premium for unlimited creation.");
            }
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

            if (!string.IsNullOrEmpty(request.CustomAudioUrl) && !string.IsNullOrEmpty(request.CustomAudioType))
            {
                song.Update(
                    customAudioUrl: request.CustomAudioUrl,
                    customAudioType: request.CustomAudioType);

                await _unitOfWork.Songs.UpdateAsync(song, cancellationToken);

                _logger.LogInformation("Audio URL saved for song {SongId}: {Url}",
                    song.Id, request.CustomAudioUrl);
            }

            _logger.LogInformation("Song created successfully: {SongId}", song.Id);

            var songWithDetails = await _unitOfWork.Songs.GetByIdAsync(song.Id, cancellationToken);
            return _mapper.Map<SongDto>(songWithDetails);
        }, cancellationToken);
    }
}
