using Application.DTOs.Song;
using AutoMapper;
using Domain.Common;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Songs;

public class GetSongChordsQueryHandler : IRequestHandler<GetSongChordsQuery, List<SongChordDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetSongChordsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<List<SongChordDto>> Handle(GetSongChordsQuery request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
        {
            throw new KeyNotFoundException($"Song with id {request.SongId} not found");
        }

        if (!song.IsPublic && request.UserId != song.OwnerId)
        {
            if (request.UserId.HasValue)
            {
                var user = await _unitOfWork.Users.GetByIdAsync(request.UserId.Value, cancellationToken);
                if (user?.Role != Constants.Roles.Admin)
                    throw new UnauthorizedAccessException("You don't have access to this song");
            }
            else
            {
                throw new UnauthorizedAccessException("Song is private");
            }
        }

        var songChords = await _unitOfWork.SongChords.GetBySongIdAsync(request.SongId, cancellationToken);
        var chords = songChords.Select(sc => sc.Chord).Where(c => c != null).ToList();

        return _mapper.Map<List<SongChordDto>>(chords);
    }
}
