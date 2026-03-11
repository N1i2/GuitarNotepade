using Application.Features.Commands.Subscriptions;
using FluentValidation;

namespace Application.Validations;

public class SubscribeToAlbumCommandValidator : AbstractValidator<SubscribeToAlbumCommand>
{
    public SubscribeToAlbumCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.AlbumId).NotEmpty();
    }
}