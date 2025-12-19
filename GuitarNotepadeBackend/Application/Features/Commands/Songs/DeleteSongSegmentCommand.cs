using MediatR;

namespace Application.Features.Commands.Songs;

public record DeleteSongSegmentCommand(
    Guid UserId,
    Guid SegmentId) : IRequest<bool>;