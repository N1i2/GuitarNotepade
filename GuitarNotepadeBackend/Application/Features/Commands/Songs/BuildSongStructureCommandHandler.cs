using Application.DTOs.Song;
using AutoMapper;
using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Songs;

public class BuildSongStructureCommandHandler : IRequestHandler<BuildSongStructureCommand, SongStructureDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ISongService _songService;
    private readonly ISongSegmentService _segmentService;
    private readonly IMapper _mapper;
    private readonly ILogger<BuildSongStructureCommandHandler> _logger;

    public BuildSongStructureCommandHandler(
        IUnitOfWork unitOfWork,
        ISongService songService,
        ISongSegmentService segmentService,
        IMapper mapper,
        ILogger<BuildSongStructureCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _songService = songService;
        _segmentService = segmentService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<SongStructureDto> Handle(BuildSongStructureCommand request, CancellationToken cancellationToken)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(request.SongId, cancellationToken);
        if (song == null)
        {
            throw new KeyNotFoundException($"Song with id {request.SongId} not found");
        }

        if (song.OwnerId != request.UserId)
        {

            throw new UnauthorizedAccessException("Only song owner can modify song structure");
        }

        var segmentDataList = request.Segments.Select(s => new SongStructure.SegmentData(
            Type: Enum.Parse<SegmentType>(s.Type),
            Lyric: s.Lyric,
            ChordId: s.ChordId,
            PatternId: s.PatternId,
            Duration: s.Duration,
            Description: s.Description,
            Color: s.Color,
            BackgroundColor: s.BackgroundColor
        )).ToList();

        if (segmentDataList.Count > Constants.Limits.MaxSegmentPositionsPerSong)
        {
            throw new InvalidOperationException($"Cannot create more than {Constants.Limits.MaxSegmentPositionsPerSong} segments per song");
        }

        var structure = await _songService.BuildSongStructureAsync(
            songId: request.SongId,
            segmentDataList: segmentDataList,
            repeatGroups: request.RepeatGroups,
            cancellationToken: cancellationToken);

        await _songService.UpdateSongStatisticsAsync(request.SongId, cancellationToken);

        _logger.LogInformation(
            "Song structure built for song {SongId} with {SegmentCount} segments by user {UserId}",
            request.SongId,
            segmentDataList.Count,
            request.UserId);

        var structureDto = _mapper.Map<SongStructureDto>(structure);

        if (request.RepeatGroups != null && request.RepeatGroups.Any())
        {
            structureDto.RepeatGroups = ConvertRepeatGroups(request.RepeatGroups);
        }

        return structureDto;
    }

    private Dictionary<string, List<int>> ConvertRepeatGroups(Dictionary<int, string> repeatGroups)
    {
        var result = new Dictionary<string, List<int>>();

        foreach (var kvp in repeatGroups)
        {
            int position = kvp.Key;
            string groupName = kvp.Value;

            if (!result.ContainsKey(groupName))
            {
                result[groupName] = new List<int>();
            }

            result[groupName].Add(position);
        }

        foreach (var groupName in result.Keys.ToList())
        {
            result[groupName].Sort();
        }

        return result;
    }
}
