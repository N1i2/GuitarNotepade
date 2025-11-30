using Application.DTOs;
using Application.Features.Commands;
using AutoMapper;

namespace Application.Mappings;

public class MappingProfile: Profile
{
    public MappingProfile()
    {
        CreateMap<RegisterUserDto, RegisterUserCommand>();
        CreateMap<LoginUserDto, LoginUserCommand>();
        CreateMap<UpdateUserProfileDto, UpdateUserProfileCommand>();
    }
}
