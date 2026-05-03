using Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Commands.Subscriptions;

public class UnsubscribeCommandHandler : IRequestHandler<UnsubscribeCommand, Unit>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<UnsubscribeCommandHandler> _logger;

    public UnsubscribeCommandHandler(
        IUnitOfWork unitOfWork,
        ILogger<UnsubscribeCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Unit> Handle(UnsubscribeCommand request, CancellationToken cancellationToken)
    {
        var subscription = await _unitOfWork.Subscriptions.GetSubscriptionAsync(
            request.UserId,
            request.SubId,
            cancellationToken);

        if (subscription == null)
        {
            throw new KeyNotFoundException("Subscription not found");
        }

        await _unitOfWork.Subscriptions.DeleteAsync(subscription.Id, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "User {UserId} unsubscribed from subscription {SubId}",
            request.UserId,
            request.SubId);

        return Unit.Value;
    }
}
