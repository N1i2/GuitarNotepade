using Application.Features.Commands.Subscriptions;
using FluentValidation;

namespace Application.Validations;

public class SubscribeCommandValidator : AbstractValidator<SubscribeCommand>
{
    public SubscribeCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.AlbumId).NotEmpty();
    }
}