using Application.DTOs.Alboms;
using AutoMapper;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Alboms
{
    public class CreateAlbumCommandHandler : IRequestHandler<CreateAlbumCommand, AlbumDto>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IWebDavService _webDavService;
        private readonly ILogger<CreateAlbumCommandHandler> _logger;

        public CreateAlbumCommandHandler(
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IWebDavService webDavService,
            ILogger<CreateAlbumCommandHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _webDavService = webDavService;
            _logger = logger;
        }

        public async Task<AlbumDto> Handle(CreateAlbumCommand request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Creating album for user {UserId}", request.UserId);

                var existingAlbum = await _unitOfWork.Alboms.GetByTitleAndOwnerAsync(
                    request.Title,
                    request.UserId,
                    cancellationToken);

                if (existingAlbum != null)
                {
                    throw new InvalidOperationException($"Album with title '{request.Title}' already exists");
                }

                string? coverUrl = null;

                if (!string.IsNullOrEmpty(request.CoverBase64) &&
                    request.CoverBase64.StartsWith("data:image/"))
                {
                    try
                    {
                        var tempAlbumId = Guid.NewGuid();

                        var fileName = await _webDavService.UploadAlbumCoverAsync(
                            request.CoverBase64,
                            tempAlbumId);

                        coverUrl = fileName;

                        _logger.LogInformation("Album cover uploaded successfully: {FileName}", fileName);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to upload album cover for user {UserId}", request.UserId);
                        throw new Exception($"Failed to upload album cover: {ex.Message}");
                    }
                }

                var album = Album.Create(
                    ownerId: request.UserId,
                    title: request.Title,
                    genre: request.Genre,
                    theme: request.Theme,
                    isPublic: request.IsPublic,
                    coverUrl: coverUrl,
                    description: request.Description);

                await _unitOfWork.Alboms.CreateAsync(album, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                if (!string.IsNullOrEmpty(coverUrl))
                {
                    try
                    {
                        var newFileName = $"{album.Id}{Path.GetExtension(coverUrl)}";
                        await RenameAlbumCoverFileAsync(coverUrl, newFileName, album.Id, cancellationToken);

                        album.UpdateCover(newFileName);
                        await _unitOfWork.Alboms.UpdateAsync(album, cancellationToken);
                        await _unitOfWork.SaveChangesAsync(cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to rename album cover file for album {AlbumId}", album.Id);
                    }
                }

                _logger.LogInformation("Album created successfully: {AlbumId}", album.Id);

                return _mapper.Map<AlbumDto>(album);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating album for user {UserId}", request.UserId);
                throw;
            }
        }

        private async Task RenameAlbumCoverFileAsync(
            string oldFileName,
            string newFileName,
            Guid albumId,
            CancellationToken cancellationToken)
        {
            try
            {
                var bytes = await _webDavService.GetAlbumCoverBytesAsync(oldFileName);
                if (bytes == null || bytes.Length == 0)
                {
                    _logger.LogWarning("Old album cover file not found or empty: {OldFileName}", oldFileName);
                    return;
                }

                var base64String = Convert.ToBase64String(bytes);
                var mimeType = GetMimeTypeFromFileName(oldFileName);
                var fullBase64 = $"data:{mimeType};base64,{base64String}";

                await _webDavService.UploadAlbumCoverAsync(fullBase64, albumId);

                await _webDavService.DeleteAlbumCoverAsync(oldFileName);

                _logger.LogInformation("Album cover renamed from {OldFileName} to {NewFileName}",
                    oldFileName, newFileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error renaming album cover file from {OldFileName} to {NewFileName}",
                    oldFileName, newFileName);
                throw;
            }
        }

        private string GetMimeTypeFromFileName(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                ".bmp" => "image/bmp",
                ".svg" => "image/svg+xml",
                _ => "image/jpeg"
            };
        }
    }
}