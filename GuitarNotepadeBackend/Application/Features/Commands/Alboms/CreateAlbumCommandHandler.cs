using Application.DTOs.Alboms;
using AutoMapper;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Alboms
{
    public class CreateAlbumCommandHandler : IRequestHandler<CreateAlbumCommand, AlbumDto>
    {
        private readonly IAlbumService _albumService;
        private readonly IUserService _userService;
        private readonly IMapper _mapper;
        private readonly ILogger<CreateAlbumCommandHandler> _logger;

        public CreateAlbumCommandHandler(
            IAlbumService albumService,
            IUserService userService,
            IMapper mapper,
            ILogger<CreateAlbumCommandHandler> logger)
        {
            _albumService = albumService;
            _userService = userService;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<AlbumDto> Handle(CreateAlbumCommand request, CancellationToken cancellationToken)
        {
            if (request.Title != "Favorite" && !await _userService.CanCreateAlbumAsync(request.UserId, cancellationToken))
            {
                throw new InvalidOperationException(
                    "Only Premium users can create albums. Upgrade to Premium to create your own albums.");
            }

            var album = await _albumService.CreateAlbumAsync(
                userId: request.UserId,
                title: request.Title,
                isPublic: request.IsPublic,
                genre: request.Genre,
                theme: request.Theme,
                coverUrl: request.CoverBase64, 
                description: request.Description,
                cancellationToken: cancellationToken);

            _logger.LogInformation("Album created successfully: {AlbumId}", album.Id);

            return _mapper.Map<AlbumDto>(album);
        }
    }
}