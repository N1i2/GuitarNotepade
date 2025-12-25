using Application.DTOs.Alboms;
using AutoMapper;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Queries.Alboms;

public class GetAlbumByIdQueryHandler : IRequestHandler<GetAlbumByIdQuery, AlbumDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IWebDavService _webDavService;

    public GetAlbumByIdQueryHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IWebDavService webDavService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _webDavService = webDavService;
    }

    public async Task<AlbumDto> Handle(GetAlbumByIdQuery request, CancellationToken cancellationToken)
    {
        var album = await _unitOfWork.Alboms.GetQueryable()
            .Include(a => a.Owner)
            .Include(a => a.SongAlbums)
            .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

        if (album == null)
        {
            throw new KeyNotFoundException($"Album with id {request.Id} not found");
        }

        var dto = _mapper.Map<AlbumDto>(album);
        dto.OwnerName = album.Owner.NikName;
        dto.CountOfSongs = album.SongAlbums.Count;

        if (!string.IsNullOrEmpty(album.CoverUrl))
        {
            dto.CoverUrl = await _webDavService.GetAlbumCoverUrlAsync(album.CoverUrl);
        }

        return dto;
    }
}