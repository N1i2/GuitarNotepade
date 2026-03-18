using MediatR;

namespace Application.Features.Commands.Songs;

public record CountOfCreateSongCommand(
    Guid userId) : IRequest<int>;
