using MediatR;

namespace Application.Features.Commands.Chords;

public record CountOfCreateChordCommand(
    Guid userId): IRequest<int>;