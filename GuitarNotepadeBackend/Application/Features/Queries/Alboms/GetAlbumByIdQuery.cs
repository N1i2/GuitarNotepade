using Application.DTOs.Alboms;
using MediatR;

namespace Application.Features.Queries.Albums;

public record GetAlbumByIdQuery(Guid Id) : IRequest<AlbumDto>;