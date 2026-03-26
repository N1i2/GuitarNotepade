using MediatR;

namespace Application.Features.Commands.Alboms;

public record CountOfCreateAlbumCommand(
    Guid userId) : IRequest<int>;
