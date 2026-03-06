using Application.DTOs.Song;
using AutoMapper;
using Domain.Common;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Songs;

public class GetSongStructureQueryHandler : IRequestHandler<GetSongStructureQuery, SongStructureDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetSongStructureQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<SongStructureDto> Handle(GetSongStructureQuery request, CancellationToken cancellationToken)
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

        var structure = await _unitOfWork.SongStructures.GetWithSegmentsAsync(request.SongId, cancellationToken);
        if (structure == null)
            throw new KeyNotFoundException($"Structure for song {request.SongId} not found");

        return _mapper.Map<SongStructureDto>(structure);
    }
}
