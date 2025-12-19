using Application.DTOs.Song;
using AutoMapper;
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
        var structure = await _unitOfWork.SongStructures.GetQueryable()
            .Include(st => st.SegmentPositions)
                .ThenInclude(sp => sp.Segment)
                    .ThenInclude(seg => seg.Chord)
            .Include(st => st.SegmentPositions)
                .ThenInclude(sp => sp.Segment)
                    .ThenInclude(seg => seg.Pattern)
            .Include(st => st.SegmentPositions)
                .ThenInclude(sp => sp.Segment)
                    .ThenInclude(seg => seg.SegmentLabels)
                        .ThenInclude(sl => sl.Label)
            .FirstOrDefaultAsync(st => st.SongId == request.SongId, cancellationToken);

        if (structure == null)
            throw new ArgumentException("Song structure not found", nameof(request.SongId));

        var structureDto = _mapper.Map<SongStructureDto>(structure);

        var repeatGroups = structure.GetSegmentsGroupedByRepeat();
        structureDto.RepeatGroups = repeatGroups.ToDictionary(
            kvp => kvp.Key,
            kvp => _mapper.Map<List<SongSegmentDto>>(kvp.Value)
        );

        return structureDto;
    }
}

