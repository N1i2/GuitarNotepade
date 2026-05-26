using Application.Features.Commands.Subscriptions;
using Application.Validations;
using FluentValidation.TestHelper;

namespace UnitTests.Validators;

public class SubscribeCommandValidatorTests
{
    private readonly SubscribeCommandValidator _validator = new();

    [Fact]
    public void T14_Subscription_ValidIds_PassValidation()
    {
        var command = new SubscribeCommand(Guid.NewGuid(), Guid.NewGuid());

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Subscription_EmptyUserId_FailsValidation()
    {
        var command = new SubscribeCommand(Guid.Empty, Guid.NewGuid());

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.UserId);
    }
}
