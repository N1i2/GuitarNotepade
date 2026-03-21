using Application.DTOs.Song;
using MediatR;

namespace Application.Features.Commands.Songs;

public class BuildSongStructureCommand : IRequest<SongStructureDto>
{
    public Guid UserId { get; }
    public Guid SongId { get; }
    public List<SegmentDataDto> Segments { get; }
    public Dictionary<int, string>? RepeatGroups { get; }
    public Dictionary<int, List<SegmentCommentDto>>? SegmentComments { get; }

    public BuildSongStructureCommand(
        Guid userId,
        Guid songId,
        List<SegmentDataDto> segments,
        Dictionary<int, string>? repeatGroups = null,
        Dictionary<int, List<SegmentCommentDto>>? segmentComments = null)
    {
        UserId = userId;
        SongId = songId;
        Segments = segments;
        RepeatGroups = repeatGroups;
        SegmentComments = segmentComments;
    }
}