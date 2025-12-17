using Application.DTOs.Chords;
using Application.DTOs.Songs;
using Application.DTOs.StrummingPatterns;
using Application.DTOs.Users;
using Application.Features.Commands.Chords;
using Application.Features.Commands.Songs;
using Application.Features.Commands.StrummingPatterns;
using Application.Features.Commands.Users;
using AutoMapper;
using Domain.Entities.HelpEntitys;
using Domain.Entities;

namespace Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<RegisterUserDto, RegisterUserCommand>();
        CreateMap<LoginUserDto, LoginUserCommand>();
        CreateMap<UpdateUserProfileWithIdDto, UpdateUserProfileCommand>();

        CreateMap<CreateSongRequestDto, CreateSongCommand>()
            .ForMember(dest => dest.Structure, opt => opt.MapFrom(src => MapStructure(src.Structure)));

        CreateMap<UpdateSongRequestDto, UpdateSongCommand>()
            .ForMember(dest => dest.Structure, opt => opt.MapFrom(src => MapStructure(src.Structure)));

        CreateMap<Song, SongDto>()
            .ForMember(dest => dest.OwnerName, opt => opt.MapFrom(src => src.Owner.NikName))
            .ForMember(dest => dest.Structure, opt => opt.MapFrom(src => MapStructureToDto(src.GetStructure())))
            .ForMember(dest => dest.ChordIds, opt => opt.MapFrom(src => src.SongChords.Select(sc => sc.ChordId)))
            .ForMember(dest => dest.PatternIds, opt => opt.MapFrom(src => src.SongPatterns.Select(sp => sp.StrummingPatternId)))
            .ForMember(dest => dest.ReviewCount, opt => opt.MapFrom(src => src.Reviews.Count))
            .ForMember(dest => dest.AverageRating, opt => opt.MapFrom(src => src.GetAverageBeautifulLevel()));

        CreateMap<CreateChordDto, CreateChordCommand>();
        CreateMap<UpdateChordDto, UpdateChordCommand>();
        CreateMap<Chord, ChordDto>()
            .ForMember(dest => dest.CreatedByNikName, opt => opt.MapFrom(src => src.CreatedBy.NikName));

        CreateMap<CreatePatternDto, CreatePatternCommand>();
        CreateMap<UpdatePatternDto, UpdatePatternCommand>();
        CreateMap<StrummingPattern, StrummingPatternsDto>()
            .ForMember(dest => dest.CreatedByNikName, opt => opt.MapFrom(src => src.CreatedBy.NikName));

        CreateMap<SongReview, DTOs.Reviews.SongReviewDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.NikName))
            .ForMember(dest => dest.SongTitle, opt => opt.MapFrom(src => src.Song.Title));
    }

    private SongStructure? MapStructure(SongStructureDto? dto)
    {
        if (dto == null) return null;

        return new SongStructure
        {
            Segments = dto.Segments.Select(s => new SongSegment
            {
                Id = s.Id,
                Type = Enum.TryParse<Domain.Common.SegmentType>(s.Type, out var type)
                    ? type
                    : Domain.Common.SegmentType.Text,
                Lyric = s.Content,
                ChordId = s.ChordId,
                PatternId = s.PatternId,
                RepeatCount = s.RepeatCount,
                Color = s.Color
            }).ToList(),
            Metadata = new SongMetadata
            {
                Key = dto.Metadata?.Key,
                Difficulty = dto.Metadata?.Difficulty,
                Tempo = !string.IsNullOrEmpty(dto.Metadata?.Tempo) && int.TryParse(dto.Metadata.Tempo, out var bpm)
                    ? new TempoInfo { Bpm = bpm }
                    : null,
                Comments = dto.Metadata?.Comments?.Select(c => new SongComment
                {
                    Id = c.Id.ToString(),
                    AuthorId = c.AuthorId,
                    Text = c.Text,
                    CreatedAt = c.CreatedAt,
                    SegmentId = c.SegmentId,
                    ParentCommentId = c.ParentCommentId?.ToString()
                }).ToList() ?? new List<SongComment>(),
                Labels = dto.Metadata?.Labels?.Select(l => new SongLabel
                {
                    Id = l.Id.ToString(),
                    Name = l.Name,
                    Color = l.Color
                }).ToList() ?? new List<SongLabel>()
            }
        };
    }

    private SongStructureDto? MapStructureToDto(SongStructure? structure)
    {
        if (structure == null) return null;

        return new SongStructureDto
        {
            Segments = structure.Segments.Select(s => new SongSegmentDto
            {
                Id = s.Id,
                Type = s.Type.ToString(),
                Content = s.Lyric,
                ChordId = s.ChordId,
                PatternId = s.PatternId,
                RepeatCount = s.RepeatCount,
                Color = s.Color
            }).ToList(),
            Metadata = new SongMetadataDto
            {
                Key = structure.Metadata?.Key,
                Tempo = structure.Metadata?.Tempo?.Bpm.ToString(),
                Difficulty = structure.Metadata?.Difficulty,
                Comments = structure.Metadata?.Comments?.Select(c => new SongCommentDto
                {
                    Id = Guid.Parse(c.Id),
                    AuthorId = c.AuthorId,
                    AuthorName = GetAuthorName(c.AuthorId)??"Unknow",
                    Text = c.Text,
                    CreatedAt = c.CreatedAt,
                    SegmentId = c.SegmentId,
                    ParentCommentId = string.IsNullOrEmpty(c.ParentCommentId)
                        ? null : Guid.Parse(c.ParentCommentId)
                }).ToList() ?? new List<SongCommentDto>(),
                Labels = structure.Metadata?.Labels?.Select(l => new SongLabelDto
                {
                    Id = Guid.Parse(l.Id),
                    Name = l.Name,
                    Color = l.Color
                }).ToList() ?? new List<SongLabelDto>()
            }
        };
    }

    private string? GetAuthorName(Guid authorId)
    {
        return null;
    }
}