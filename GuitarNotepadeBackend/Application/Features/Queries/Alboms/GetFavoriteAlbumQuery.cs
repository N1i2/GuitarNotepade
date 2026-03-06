using Application.DTOs.Alboms;
using MediatR;

namespace Application.Features.Queries.Albums;

public class GetFavoriteAlbumQuery : IRequest<AlbumWithSongsDto>
{
    public Guid UserId { get; }

    public GetFavoriteAlbumQuery(Guid userId)
    {
        UserId = userId;
    }
}
