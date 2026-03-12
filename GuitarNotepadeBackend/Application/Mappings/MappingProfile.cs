using Application.DTOs.Alboms;
using Application.DTOs.Chords;
using Application.DTOs.Song;
using Application.DTOs.StrummingPatterns;
using Application.DTOs.Subscriptions;
using Application.DTOs.Users;
using Application.Features.Commands.Alboms;
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

        CreateMap<Song, FullSongDto>()
            .ForMember(dest => dest.OwnerName, opt => opt.MapFrom(src => src.Owner != null ? src.Owner.NikName : null))
            .ForMember(dest => dest.ParentSongTitle, opt => opt.MapFrom(src => src.ParentSong != null ? src.ParentSong.Title : null))
            .ForMember(dest => dest.Chords, opt => opt.MapFrom(src => src.SongChords.Select(sc => sc.Chord)))
            .ForMember(dest => dest.Patterns, opt => opt.MapFrom(src => src.SongPatterns.Select(sp => sp.StrummingPattern)))
            .ForMember(dest => dest.Comments, opt => opt.MapFrom(src => src.Comments))
            .ForMember(dest => dest.Segments, opt => opt.MapFrom(src => MapSegmentsWithPositions(src)))
            .ForMember(dest => dest.AverageBeautifulRating, opt => opt.MapFrom(src =>
                src.AverageBeautifulRating.HasValue ? (double?)Convert.ToDouble(src.AverageBeautifulRating.Value) : null))
            .ForMember(dest => dest.AverageDifficultyRating, opt => opt.MapFrom(src =>
                src.AverageDifficultyRating.HasValue ? (double?)Convert.ToDouble(src.AverageDifficultyRating.Value) : null));

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
            .ForMember(dest => dest.Chord, opt => opt.MapFrom(src => src.Chord))
            .ForMember(dest => dest.Pattern, opt => opt.MapFrom(src => src.Pattern));

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
            .ForMember(dest => dest.Pattern, opt => opt.MapFrom(src => src.Pattern));

        CreateMap<SongSegmentPosition, SegmentDataWithPositionDto>()
            .ForMember(dest => dest.PositionIndex, opt => opt.MapFrom(src => src.PositionIndex))
            .ForMember(dest => dest.RepeatGroup, opt => opt.MapFrom(src => src.RepeatGroup))
            .ForMember(dest => dest.SegmentData, opt => opt.MapFrom(src => src.Segment));

        CreateMap<SongSegmentPosition, SongSegmentPositionDto>()
            .ForMember(dest => dest.Segment, opt => opt.MapFrom(src => src.Segment));

        CreateMap<SongStructure, SongStructureDto>()
            .ForMember(dest => dest.RepeatGroups, opt => opt.Ignore());

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

        CreateMap<Album, AlbumDto>()
            .ForMember(dest => dest.OwnerName, opt => opt.Ignore())
            .ForMember(dest => dest.CountOfSongs, opt => opt.MapFrom(src => src.SongAlbums.Count))
            .ForMember(dest => dest.CoverUrl, opt => opt.Ignore());

        CreateMap<Album, AlbumWithSongsDto>()
            .IncludeBase<Album, AlbumDto>()
            .ForMember(dest => dest.Songs, opt => opt.Ignore());

        CreateMap<Song, SongInAlbumDto>()
            .ForMember(dest => dest.OwnerName, opt => opt.MapFrom(src => src.Owner != null ? src.Owner.NikName : string.Empty))
            .ForMember(dest => dest.ChordCount, opt => opt.MapFrom(src => src.SongChords.Count))
            .ForMember(dest => dest.PatternCount, opt => opt.MapFrom(src => src.SongPatterns.Count))
            .ForMember(dest => dest.ReviewCount, opt => opt.MapFrom(src => src.Reviews.Count))
            .ForMember(dest => dest.CommentsCount, opt => opt.MapFrom(src => src.Comments.Count))
            .ForMember(dest => dest.HasAudio, opt => opt.MapFrom(src => !string.IsNullOrEmpty(src.CustomAudioUrl)))
            .ForMember(dest => dest.AverageBeautifulRating, opt => opt.MapFrom(src =>
                src.Reviews.Any(r => r.BeautifulLevel.HasValue)
                    ? (int?)Math.Round(src.Reviews.Where(r => r.BeautifulLevel.HasValue).Average(r => r.BeautifulLevel!.Value))
                    : null))
            .ForMember(dest => dest.AverageDifficultyRating, opt => opt.MapFrom(src =>
                src.Reviews.Any(r => r.DifficultyLevel.HasValue)
                    ? (int?)Math.Round(src.Reviews.Where(r => r.DifficultyLevel.HasValue).Average(r => r.DifficultyLevel!.Value))
                    : null));

        CreateMap<Subscription, SubscriptionDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Subscriber != null ? src.Subscriber.NikName : string.Empty))
            .ForMember(dest => dest.SubName, opt => opt.Ignore()) 
            .ForMember(dest => dest.TargetId, opt => opt.Ignore()); 
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
            } : null
        };
    }
}
