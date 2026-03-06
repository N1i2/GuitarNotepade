using Application.DTOs.Alboms;
using MediatR;

namespace Application.Features.Queries.Alboms;

public record GetAlbumByIdWithSongsQuery(Guid Id) : IRequest<AlbumWithSongsDto>;
