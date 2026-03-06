using Domain.Interfaces.Services;
using MediatR;

namespace Application.Features.Queries.Alboms;

public class GetAlbumCoverQueryHandler : IRequestHandler<GetAlbumCoverQuery, string?>
{
    private readonly IWebDavService _webDavService;

    public GetAlbumCoverQueryHandler(IWebDavService webDavService)
    {
        _webDavService = webDavService;
    }

    public async Task<string?> Handle(GetAlbumCoverQuery request, CancellationToken cancellationToken)
    {
        return await _webDavService.GetAlbumCoverUrlAsync(request.FileName);
    }
}
