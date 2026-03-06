using Application.DTOs.Song.Comment;
using Application.Features.Commands.Songs;
using Application.Mappings;
using Application.Validations;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
        });

        services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfile>());

        services.AddScoped<IValidator<CreateSongCommand>, CreateSongCommandValidator>();
        services.AddScoped<IValidator<UpdateSongCommand>, UpdateSongCommandValidator>();
        services.AddScoped<IValidator<CreateSongReviewDto>, CreateSongReviewDtoValidator>();

        return services;
    }
}
