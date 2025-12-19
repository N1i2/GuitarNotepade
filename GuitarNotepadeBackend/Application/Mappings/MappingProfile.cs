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
            .ForMember(dest => dest.AuthorId, opt => opt.MapFrom(src => src.Song != null ? src.Song.OwnerId : (Guid?)null))
            .ForMember(dest => dest.AuthorName, opt => opt.MapFrom(src => src.Song != null && src.Song.Owner != null ? src.Song.Owner.NikName : null))
            .ForMember(dest => dest.AuthorAvatar, opt => opt.MapFrom(src => src.Song != null && src.Song.Owner != null ? src.Song.Owner.AvatarUrl : null));

        CreateMap<SongReview, SongReviewDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User != null ? src.User.NikName : string.Empty))
            .ForMember(dest => dest.UserAvatar, opt => opt.MapFrom(src => src.User != null ? src.User.AvatarUrl : null))
            .ForMember(dest => dest.LikesCount, opt => opt.MapFrom(src => src.Likes.Count(l => l.IsLike)))
            .ForMember(dest => dest.DislikesCount, opt => opt.MapFrom(src => src.Likes.Count(l => !l.IsLike)))
            .ForMember(dest => dest.CurrentUserLike, opt => opt.Ignore());

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

        CreateMap<SongStructure, SongStructureDto>()
            .ForMember(dest => dest.RepeatGroups, opt => opt.Ignore()); 

        CreateMap<SongSegmentPosition, SongSegmentPositionDto>();

        CreateMap<ReviewLike, ReviewLikeDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User != null ? src.User.NikName : string.Empty));

        CreateMap<SegmentLabel, SegmentLabelDto>();

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
    }

    private string? GetAuthorName(Guid authorId)
    {
        return null;
    }
}
