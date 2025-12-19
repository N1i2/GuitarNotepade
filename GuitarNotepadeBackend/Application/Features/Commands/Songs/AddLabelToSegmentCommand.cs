using MediatR;

namespace Application.Features.Commands.Songs;

public record AddLabelToSegmentCommand(
    Guid UserId,
    Guid SegmentId,
    Guid LabelId) : IRequest<bool>;