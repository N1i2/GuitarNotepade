using Application.DTOs.Users;
using Application.Features.Commands.Users;
using AutoMapper;

namespace Application.Mappings;

public class MappingProfile: Profile
{
    public MappingProfile()
    {
        CreateMap<RegisterUserDto, RegisterUserCommand>();
        CreateMap<LoginUserDto, LoginUserCommand>();
        CreateMap<UpdateUserProfileWithIdDto, UpdateUserProfileCommand>();
    }
}
