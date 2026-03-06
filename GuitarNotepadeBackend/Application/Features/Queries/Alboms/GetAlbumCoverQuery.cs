using MediatR;

namespace Application.Features.Queries.Alboms;

public class GetAlbumCoverQuery : IRequest<string?>
{
    public string FileName { get; set; } = string.Empty;
}
