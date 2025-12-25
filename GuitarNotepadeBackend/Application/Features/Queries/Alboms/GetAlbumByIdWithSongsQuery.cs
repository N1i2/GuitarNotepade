using Application.DTOs.Alboms;
using MediatR;

namespace Application.Features.Queries.Albums;

public record GetAlbumByIdWithSongsQuery(Guid Id) : IRequest<AlbumWithSongsDto>;