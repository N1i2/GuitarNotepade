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
            .Where(s => s.Id == request.SongId);

        query = query
            .Include(s => s.Owner)
            .Include(s => s.ParentSong);

        if (request.IncludeStructure)
        {
            query = query
                .Include(s => s.Structure)
                    .ThenInclude(st => st!.SegmentPositions)
                        .ThenInclude(sp => sp.Segment)
                            .ThenInclude(seg => seg.Chord)
                .Include(s => s.Structure)
                    .ThenInclude(st => st!.SegmentPositions)
                        .ThenInclude(sp => sp.Segment)
                            .ThenInclude(seg => seg.Pattern);
        }

        if (request.IncludeChords)
        {
            query = query
                .Include(s => s.SongChords)
                    .ThenInclude(sc => sc.Chord);
        }

        if (request.IncludePatterns)
        {
            query = query
                .Include(s => s.SongPatterns)
                    .ThenInclude(sp => sp.StrummingPattern);
        }

        if (request.IncludeReviews)
        {
            query = query
                .Include(s => s.Reviews)
                    .ThenInclude(r => r.User);
        }

        if (request.IncludeComments)
        {
            query = query
                .Include(s => s.Comments)
                    .ThenInclude(c => c.User)
                .Include(s => s.Comments)
                    .ThenInclude(c => c.Segment);
        }

        var song = await query.FirstOrDefaultAsync(cancellationToken);

        if (song == null)
        {
            throw new KeyNotFoundException("Song not found");
        }

        if (!song.IsPublic)
        {
            if (request.UserId == null)
            {
                throw new UnauthorizedAccessException("Song is private");
            }

            if (song.OwnerId != request.UserId.Value)
            {
                var user = await _unitOfWork.Users.GetByIdAsync(request.UserId.Value, cancellationToken);
                if (user?.Role != Constants.Roles.Admin)
                {
                    throw new UnauthorizedAccessException("You do not have permission to access this song");
                }
            }
        }

        return _mapper.Map<FullSongDto>(song);
    }
}
