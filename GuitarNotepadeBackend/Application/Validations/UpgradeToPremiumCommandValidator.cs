using Application.Features.Commands.Payments;
using FluentValidation;

namespace Application.Validations;

public class UpgradeToPremiumCommandValidator : AbstractValidator<UpgradeToPremiumCommand>
{
    public UpgradeToPremiumCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PaymentMethod).NotEmpty();
        RuleFor(x => x.PaymentToken).NotEmpty();
    }
}