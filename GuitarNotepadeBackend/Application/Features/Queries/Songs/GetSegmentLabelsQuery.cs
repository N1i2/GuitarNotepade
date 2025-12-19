using Application.DTOs.Generic;
using MediatR;

namespace Application.Features.Queries.Songs;

public record GetSegmentLabelsQuery(
    Guid SegmentId) : IRequest<List<SegmentLabelDto>>;