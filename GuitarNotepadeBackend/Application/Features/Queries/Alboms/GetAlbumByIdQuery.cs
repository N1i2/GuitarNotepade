using Application.DTOs.Alboms;
using MediatR;

namespace Application.Features.Queries.Alboms;

public record GetAlbumByIdQuery(Guid Id) : IRequest<AlbumDto>;
