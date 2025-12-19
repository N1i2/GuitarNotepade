using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Songs;

public class GetSongByIdQueryHandler : IRequestHandler<GetSongByIdQuery, SongDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetSongByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<SongDto> Handle(GetSongByIdQuery request, CancellationToken cancellationToken)
    {
        IQueryable<Domain.Entities.Song> query = _unitOfWork.Songs.GetQueryable()
            .Include(s => s.Owner)
            .Include(s => s.ParentSong);

        if (request.IncludeChords)
        {
            query = query.Include(s => s.SongChords)
                .ThenInclude(sc => sc.Chord);
        }

        if (request.IncludePatterns)
        {
            query = query.Include(s => s.SongPatterns)
                .ThenInclude(sp => sp.StrummingPattern);
        }

        if (request.IncludeStructure)
        {
            query = query.Include(s => s.Structure)
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
                                .ThenInclude(sl => sl.Label);
        }

        var song = await query.FirstOrDefaultAsync(s => s.Id == request.SongId, cancellationToken);

        if (song == null)
        {
            throw new ArgumentException("Song not found", nameof(request.SongId));
        }

        if (!song.IsPublic && song.OwnerId != request.SongId)
        {
            throw new UnauthorizedAccessException("You don't have permission to access this song");
        }

        var songDto = _mapper.Map<SongDto>(song);

        if (request.IncludeReviews)
        {
            var reviews = await _unitOfWork.SongReviews.GetBySongIdAsync(request.SongId, cancellationToken);
        }

        if (request.IncludeComments)
        {
            var commentsCount = await _unitOfWork.SongComments.CountBySongIdAsync(request.SongId, cancellationToken);
            songDto.CommentsCount = commentsCount;
        }

        return songDto;
    }
}