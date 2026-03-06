using Application.DTOs.Alboms;
using AutoMapper;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Queries.Albums;

public class GetFavoriteAlbumQueryHandler : IRequestHandler<GetFavoriteAlbumQuery, AlbumWithSongsDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetFavoriteAlbumQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<AlbumWithSongsDto> Handle(GetFavoriteAlbumQuery request, CancellationToken cancellationToken)
    {
        var favoriteAlbum = await _unitOfWork.Alboms.FindAsync(
            a => a.OwnerId == request.UserId && a.Title.ToLower() == "favorite");

        if (favoriteAlbum == null)
            throw new KeyNotFoundException("Favorite album not found");

        var songs = await _unitOfWork.SongAlboms.GetSongsByAlbumIdAsync(favoriteAlbum.Id, cancellationToken);

        var albumDto = _mapper.Map<AlbumWithSongsDto>(favoriteAlbum);
        albumDto.Songs = _mapper.Map<List<SongInAlbumDto>>(songs);
        albumDto.CountOfSongs = songs.Count;

        return albumDto;
    }
}
