using MediatR;

namespace Application.Features.Commands.Subscriptions;

public record CountOfCreateSubscriptionCommand(
    Guid userId) : IRequest<int>;

