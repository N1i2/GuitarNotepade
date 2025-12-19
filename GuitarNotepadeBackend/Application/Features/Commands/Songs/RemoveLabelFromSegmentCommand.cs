using MediatR;

namespace Application.Features.Commands.Songs;

public record RemoveLabelFromSegmentCommand(
    Guid UserId,
    Guid SegmentId,
    Guid LabelId) : IRequest<bool>;