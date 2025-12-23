using Application.DTOs.Chords;
using Application.DTOs.Song;
using Application.DTOs.StrummingPatterns;
using Application.DTOs.Users;
using Application.Features.Commands.Users;
using AutoMapper;
using Domain.Entities;

namespace Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<RegisterUserDto, RegisterUserCommand>();
        CreateMap<LoginUserDto, LoginUserCommand>();
        CreateMap<UpdateUserProfileWithIdDto, UpdateUserProfileCommand>();

        CreateMap<Song, SongDto>()
            .ForMember(dest => dest.OwnerName, opt => opt.MapFrom(src => src.Owner != null ? src.Owner.NikName : null))
            .ForMember(dest => dest.ParentSongTitle, opt => opt.MapFrom(src => src.ParentSong != null ? src.ParentSong.Title : null))
            .ForMember(dest => dest.Chords, opt => opt.MapFrom(src => src.SongChords.Select(sc => sc.Chord)))
            .ForMember(dest => dest.Patterns, opt => opt.MapFrom(src => src.SongPatterns.Select(sp => sp.StrummingPattern)))
            .ForMember(dest => dest.CommentsCount, opt => opt.MapFrom(src => src.Comments.Count))
            .ForMember(dest => dest.SegmentsCount, opt => opt.MapFrom(src => src.Structure != null ? src.Structure.SegmentPositions.Count : 0));

        CreateMap<SongComment, SongCommentDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.SongId, opt => opt.MapFrom(src => src.SongId))
            .ForMember(dest => dest.SegmentId, opt => opt.MapFrom(src => src.SegmentId))
            .ForMember(dest => dest.Text, opt => opt.MapFrom(src => src.Text))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt));

        CreateMap<SongReview, SongReviewDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User != null ? src.User.NikName : string.Empty))
            .ForMember(dest => dest.UserAvatar, opt => opt.MapFrom(src => src.User != null ? src.User.AvatarUrl : null));

        CreateMap<SongSegment, SongSegmentDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
            .ForMember(dest => dest.Chord, opt => opt.MapFrom(src => src.Chord != null ? new SongChordDto
            {
                Id = src.Chord.Id,
                Name = src.Chord.Name,
                Fingering = src.Chord.Fingering,
                Description = src.Chord.Description
            } : null))
            .ForMember(dest => dest.Pattern, opt => opt.MapFrom(src => src.Pattern != null ? new SongPatternDto
            {
                Id = src.Pattern.Id,
                Name = src.Pattern.Name,
                Pattern = src.Pattern.Pattern,
                IsFingerStyle = src.Pattern.IsFingerStyle,
                Description = src.Pattern.Description
            } : null))
            .ForMember(dest => dest.Labels, opt => opt.MapFrom(src => src.SegmentLabels.Select(sl => sl.Label)));

        CreateMap<SongSegment, SegmentDataDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
            .ForMember(dest => dest.Lyric, opt => opt.MapFrom(src => src.Lyric))
            .ForMember(dest => dest.ChordId, opt => opt.MapFrom(src => src.ChordId))
            .ForMember(dest => dest.PatternId, opt => opt.MapFrom(src => src.PatternId))
            .ForMember(dest => dest.Duration, opt => opt.MapFrom(src => src.Duration))
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description))
            .ForMember(dest => dest.Color, opt => opt.MapFrom(src => src.Color))
            .ForMember(dest => dest.BackgroundColor, opt => opt.MapFrom(src => src.BackgroundColor))
            .ForMember(dest => dest.Chord, opt => opt.MapFrom(src => src.Chord))
            .ForMember(dest => dest.Pattern, opt => opt.MapFrom(src => src.Pattern))
            .ForMember(dest => dest.Labels, opt => opt.MapFrom(src => src.SegmentLabels.Select(sl => sl.Label)));

        CreateMap<SongSegmentPosition, SegmentDataWithPositionDto>()
            .ForMember(dest => dest.PositionIndex, opt => opt.MapFrom(src => src.PositionIndex))
            .ForMember(dest => dest.RepeatGroup, opt => opt.MapFrom(src => src.RepeatGroup))
            .ForMember(dest => dest.SegmentData, opt => opt.MapFrom(src => src.Segment));

        CreateMap<SongSegmentPosition, SongSegmentPositionDto>()
            .ForMember(dest => dest.Segment, opt => opt.MapFrom(src => src.Segment));

        CreateMap<SongStructure, SongStructureDto>()
            .ForMember(dest => dest.RepeatGroups, opt => opt.Ignore());

        CreateMap<SegmentLabel, SegmentLabelDto>();

        CreateMap<SongLabel, SegmentLabelDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.Color, opt => opt.MapFrom(src => src.Color));

        CreateMap<SongLabel, SongLabelDto>();

        CreateMap<Chord, ChordDto>()
            .ForMember(dest => dest.CreatedByNikName, opt => opt.MapFrom(src => src.CreatedBy != null ? src.CreatedBy.NikName : null));

        CreateMap<Chord, SongChordDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.Fingering, opt => opt.MapFrom(src => src.Fingering))
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description));

        CreateMap<StrummingPattern, StrummingPatternsDto>()
            .ForMember(dest => dest.CreatedByNikName, opt => opt.MapFrom(src => src.CreatedBy != null ? src.CreatedBy.NikName : null));

        CreateMap<StrummingPattern, SongPatternDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.Pattern, opt => opt.MapFrom(src => src.Pattern))
            .ForMember(dest => dest.IsFingerStyle, opt => opt.MapFrom(src => src.IsFingerStyle))
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description));

        CreateMap<Song, FullSongDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.Title, opt => opt.MapFrom(src => src.Title))
            .ForMember(dest => dest.Artist, opt => opt.MapFrom(src => src.Artist))
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description))
            .ForMember(dest => dest.IsPublic, opt => opt.MapFrom(src => src.IsPublic))
            .ForMember(dest => dest.OwnerId, opt => opt.MapFrom(src => src.OwnerId))
            .ForMember(dest => dest.OwnerName, opt => opt.MapFrom(src => src.Owner != null ? src.Owner.NikName : null))
            .ForMember(dest => dest.ParentSongId, opt => opt.MapFrom(src => src.ParentSongId))
            .ForMember(dest => dest.ParentSongTitle, opt => opt.MapFrom(src => src.ParentSong != null ? src.ParentSong.Title : null))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => src.UpdatedAt))
            .ForMember(dest => dest.ReviewCount, opt => opt.MapFrom(src => src.ReviewCount))
            .ForMember(dest => dest.AverageBeautifulRating, opt => opt.MapFrom(src =>
                src.AverageBeautifulRating.HasValue ? (double?)Convert.ToDouble(src.AverageBeautifulRating.Value) : null))
            .ForMember(dest => dest.AverageDifficultyRating, opt => opt.MapFrom(src =>
                src.AverageDifficultyRating.HasValue ? (double?)Convert.ToDouble(src.AverageDifficultyRating.Value) : null))
            .ForMember(dest => dest.Chords, opt => opt.MapFrom(src => src.SongChords.Select(sc => sc.Chord)))
            .ForMember(dest => dest.Patterns, opt => opt.MapFrom(src => src.SongPatterns.Select(sp => sp.StrummingPattern)))
            .ForMember(dest => dest.Comments, opt => opt.MapFrom(src => src.Comments))
            .ForMember(dest => dest.Segments, opt => opt.MapFrom(src => MapSegmentsWithPositions(src)));
    }

    private List<SegmentDataWithPositionDto> MapSegmentsWithPositions(Song song)
    {
        if (song.Structure == null || song.Structure.SegmentPositions == null)
            return new List<SegmentDataWithPositionDto>();

        return song.Structure.SegmentPositions
            .OrderBy(sp => sp.PositionIndex)
            .Select(sp => new SegmentDataWithPositionDto
            {
                PositionIndex = sp.PositionIndex,
                RepeatGroup = sp.RepeatGroup,
                SegmentData = MapSegmentToDto(sp.Segment)
            })
            .ToList();
    }

    private SegmentDataDto MapSegmentToDto(SongSegment segment)
    {
        if (segment == null)
            return new SegmentDataDto();

        return new SegmentDataDto
        {
            Id = segment.Id,
            Type = segment.Type.ToString(),
            Lyric = segment.Lyric,
            ChordId = segment.ChordId,
            PatternId = segment.PatternId,
            Duration = segment.Duration,
            Description = segment.Description,
            Color = segment.Color,
            BackgroundColor = segment.BackgroundColor,
            Chord = segment.Chord != null ? new SongChordDto
            {
                Id = segment.Chord.Id,
                Name = segment.Chord.Name,
                Fingering = segment.Chord.Fingering,
                Description = segment.Chord.Description
            } : null,
            Pattern = segment.Pattern != null ? new SongPatternDto
            {
                Id = segment.Pattern.Id,
                Name = segment.Pattern.Name,
                Pattern = segment.Pattern.Pattern,
                IsFingerStyle = segment.Pattern.IsFingerStyle,
                Description = segment.Pattern.Description
            } : null,
            Labels = segment.SegmentLabels?
                .Select(sl => new SegmentLabelDto
                {
                    Id = sl.Label.Id,
                    Name = sl.Label.Name,
                    Color = sl.Label.Color
                })
                .ToList() ?? new List<SegmentLabelDto>()
        };
    }
}