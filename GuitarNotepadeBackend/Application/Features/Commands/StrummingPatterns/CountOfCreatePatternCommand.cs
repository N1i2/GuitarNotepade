using MediatR;

namespace Application.Features.Commands.StrummingPatterns;

public record CountOfCreatePatternCommand(
    Guid userId): IRequest<int>;
