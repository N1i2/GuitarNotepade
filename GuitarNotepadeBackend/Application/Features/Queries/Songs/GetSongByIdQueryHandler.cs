using Application.DTOs.Song;
using AutoMapper;
using Domain.Common;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Songs;

public class GetSongByIdQueryHandler : IRequestHandler<GetSongByIdQuery, FullSongDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetSongByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
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

        if(user == null)
        {
            throw new ArgumentException("You not a human, go out bitch", nameof(request.SongId));
        }

        if (song == null)
        {
            throw new ArgumentException("Song not found", nameof(request.SongId));
        }

        if (user!.Role != Constants.Roles.Admin && !song.IsPublic && song.OwnerId != request.UserId)
        {
            throw new UnauthorizedAccessException("You don't have permission to access this song");
        }

        var fullSongDto = _mapper.Map<FullSongDto>(song);

        if (request.IncludeReviews)
        {
            var reviews = await _unitOfWork.SongReviews.GetBySongIdAsync(request.SongId, cancellationToken);
        }

        return fullSongDto;
    }
}