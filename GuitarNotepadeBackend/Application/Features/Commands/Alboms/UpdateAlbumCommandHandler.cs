using Application.DTOs.Alboms;
using AutoMapper;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using Domain.ValidationRules.AlbomRules;
using MediatR;

namespace Application.Features.Commands.Alboms;

public class UpdateAlbumCommandHandler : IRequestHandler<UpdateAlbumCommand, AlbumDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IWebDavService _webDavService;
    private readonly IMapper _mapper;

    public UpdateAlbumCommandHandler(
        IUnitOfWork unitOfWork,
        IWebDavService webDavService,
        IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _webDavService = webDavService;
        _mapper = mapper;
    }

    public async Task<AlbumDto> Handle(UpdateAlbumCommand request, CancellationToken cancellationToken)
    {
        return await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            var album = await _unitOfWork.Alboms.GetByIdWithDetailsAsync(request.AlbumId, cancellationToken);
            if (album == null)
            {
                throw new KeyNotFoundException($"Album with id {request.AlbumId} not found");
            }

            if (album.OwnerId != request.UserId)
            {
                throw new UnauthorizedAccessException("You don't have permission to update this album");
            }

            if (!string.IsNullOrEmpty(request.Title) && request.Title != album.Title)
            {
                var existingAlbum = await _unitOfWork.Alboms.GetByTitleAndOwnerAsync(
                    request.Title, request.UserId, cancellationToken);

                if (existingAlbum != null && existingAlbum.Id != request.AlbumId)
                {
                    throw new InvalidOperationException($"You already have an album with title '{request.Title}'");
                }
            }

            string? newCoverFileName = null;
            if (!string.IsNullOrEmpty(request.CoverBase64))
            {
                if (!string.IsNullOrEmpty(album.CoverUrl))
                {
                    await _webDavService.DeleteAlbumCoverAsync(album.CoverUrl);
                }

                newCoverFileName = await _webDavService.UploadAlbumCoverAsync(
                    request.CoverBase64, request.AlbumId);
            }

            album.Update(
                title: request.Title,
                genre: request.Genre,
                theme: request.Theme,
                coverUrl: newCoverFileName ?? album.CoverUrl,
                description: request.Description,
                isPublic: request.IsPublic);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var albumDto = _mapper.Map<AlbumDto>(album);
            albumDto.CountOfSongs = album.SongsCount;
            albumDto.OwnerName = album.Owner?.NikName ?? string.Empty;

            return albumDto;
        }, cancellationToken);
    }
}
