using Application.DTOs.Song;
using AutoMapper;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Queries.Songs;

public class GetSongLabelsQueryHandler : IRequestHandler<GetSongLabelsQuery, List<SongLabelDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetSongLabelsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<List<SongLabelDto>> Handle(GetSongLabelsQuery request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
            throw new ArgumentException("Song not found", nameof(request.SongId));

        var labels = await _unitOfWork.SongLabels.GetLabelsForSongAsync(request.SongId, cancellationToken);

        return _mapper.Map<List<SongLabelDto>>(labels);
    }
}

