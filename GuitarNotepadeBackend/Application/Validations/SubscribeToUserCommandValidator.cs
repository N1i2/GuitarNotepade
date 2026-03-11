using Application.Features.Commands.Subscriptions;
using FluentValidation;

namespace Application.Validations;

public class SubscribeToUserCommandValidator : AbstractValidator<SubscribeToUserCommand>
{
    public SubscribeToUserCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.TargetUserId).NotEmpty()
            .NotEqual(x => x.UserId).WithMessage("Cannot subscribe to yourself");
    }
}