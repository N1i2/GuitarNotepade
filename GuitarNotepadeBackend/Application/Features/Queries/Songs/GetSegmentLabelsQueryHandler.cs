using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Songs;

public class GetSegmentLabelsQueryHandler : IRequestHandler<GetSegmentLabelsQuery, List<SegmentLabelDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetSegmentLabelsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<List<SegmentLabelDto>> Handle(GetSegmentLabelsQuery request, CancellationToken cancellationToken)
    {
        var segment = await _unitOfWork.SongSegments.GetQueryable()
            .Include(s => s.SegmentLabels)
                .ThenInclude(sl => sl.Label)
            .FirstOrDefaultAsync(s => s.Id == request.SegmentId, cancellationToken);

        if (segment == null)
            throw new ArgumentException("Segment not found", nameof(request.SegmentId));

        var segmentLabels = segment.SegmentLabels.ToList();

        return _mapper.Map<List<SegmentLabelDto>>(segmentLabels);
    }
}

