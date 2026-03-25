using Application.DTOs.Alboms;
using AutoMapper;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Alboms;

public class UpdateAlbumCommandHandler : IRequestHandler<UpdateAlbumCommand, AlbumDto>
{
    private readonly IAlbumService _albumService;
    private readonly IMapper _mapper;
    private readonly ILogger<UpdateAlbumCommandHandler> _logger;
    private readonly IWebDavService _webDavService;

    public UpdateAlbumCommandHandler(
        IAlbumService albumService,
        IMapper mapper,
        ILogger<UpdateAlbumCommandHandler> logger,
        IWebDavService webDavService)
    {
        _albumService = albumService;
        _mapper = mapper;
        _logger = logger;
        _webDavService = webDavService;
    }

    public async Task<AlbumDto> Handle(UpdateAlbumCommand request, CancellationToken cancellationToken)
    {
        var album = await _albumService.UpdateAlbumAsync(
            albumId: request.AlbumId,
            userId: request.UserId,
            title: request.Title,
            isPublic: request.IsPublic,
            genre: request.Genre,
            theme: request.Theme,
            coverBase64: request.CoverBase64,
            description: request.Description,
            cancellationToken: cancellationToken);

        _logger.LogInformation("Album updated successfully: {AlbumId}", album.Id);

        var albumDto = _mapper.Map<AlbumDto>(album);

        if (!string.IsNullOrEmpty(album.CoverUrl))
        {
            albumDto.CoverUrl = await _webDavService.GetAlbumCoverUrlAsync(album.CoverUrl);
        }

        return albumDto;
    }
}
