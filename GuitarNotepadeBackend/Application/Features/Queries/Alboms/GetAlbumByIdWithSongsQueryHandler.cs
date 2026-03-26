using Application.DTOs.Alboms;
using Application.Exceptions;
using AutoMapper;
using Domain.Common;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Queries.Alboms;

public class GetAlbumByIdWithSongsQueryHandler :
    IRequestHandler<GetAlbumByIdWithSongsQuery, AlbumWithSongsDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IWebDavService _webDavService;

    public GetAlbumByIdWithSongsQueryHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IWebDavService webDavService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _webDavService = webDavService;
    }

    public async Task<AlbumWithSongsDto> Handle(
        GetAlbumByIdWithSongsQuery request,
        CancellationToken cancellationToken)
    {
        var album = await _unitOfWork.Alboms.GetByIdWithDetailsAsync(request.Id, cancellationToken);

        if (album == null)
        {
            throw new KeyNotFoundException($"Album with id {request.Id} not found");
        }

        var owner = await _unitOfWork.Users.GetByIdAsync(album.OwnerId, cancellationToken);
        if (owner == null)
        {
            throw new KeyNotFoundException($"Owner of album not found");
        }

        if (!album.IsPublic)
        {
            if (request.UserId == Guid.Empty)
            {
                throw new UnauthorizedAccessException("Please log in to view this private album");
            }

            var user = await _unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken);
            var isOwner = album.OwnerId == request.UserId;
            var isAdmin = user?.Role == Constants.Roles.Admin;

            if (!isOwner && !isAdmin)
            {
                throw new ForbiddenAccessException("This album is private. You don't have access to view it.");
            }
        }

        var songs = await _unitOfWork.SongAlboms.GetSongsByAlbumIdAsync(request.Id, cancellationToken);

        var albumWithSongsDto = _mapper.Map<AlbumWithSongsDto>(album);
        albumWithSongsDto.OwnerName = owner.NikName;
        albumWithSongsDto.CountOfSongs = songs.Count;

        if (!string.IsNullOrEmpty(album.CoverUrl))
        {
            albumWithSongsDto.CoverUrl = await _webDavService.GetAlbumCoverUrlAsync(album.CoverUrl);
        }

        albumWithSongsDto.Songs = _mapper.Map<List<SongInAlbumDto>>(songs);

        foreach (var songDto in albumWithSongsDto.Songs)
        {
            var song = songs.First(s => s.Id == songDto.Id);
            songDto.OwnerName = song.Owner?.NikName ?? "Unknown";
            songDto.ChordCount = song.SongChords?.Count ?? 0;
            songDto.PatternCount = song.SongPatterns?.Count ?? 0;
            songDto.ReviewCount = song.Reviews?.Count ?? 0;
            songDto.CommentsCount = song.Comments?.Count ?? 0;

            songDto.HasAudio = !string.IsNullOrEmpty(song.CustomAudioUrl) &&
                              !string.IsNullOrEmpty(song.CustomAudioType);

            if (song.Reviews != null && song.Reviews.Any())
            {
                var beautifulReviews = song.Reviews.Where(r => r.BeautifulLevel.HasValue).ToList();
                if (beautifulReviews.Any())
                {
                    songDto.AverageBeautifulRating = (int)Math.Round(
                        beautifulReviews.Average(r => r.BeautifulLevel!.Value));
                }

                var difficultyReviews = song.Reviews.Where(r => r.DifficultyLevel.HasValue).ToList();
                if (difficultyReviews.Any())
                {
                    songDto.AverageDifficultyRating = (int)Math.Round(
                        difficultyReviews.Average(r => r.DifficultyLevel!.Value));
                }
            }
        }

        return albumWithSongsDto;
    }
}
