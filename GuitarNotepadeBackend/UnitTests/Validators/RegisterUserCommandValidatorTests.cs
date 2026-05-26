using Application.Features.Commands.Users;
using Application.Validations;
using FluentValidation.TestHelper;

namespace UnitTests.Validators;

public class RegisterUserCommandValidatorTests
{
    private readonly RegisterUserCommandValidator _validator = new();

    [Fact]
    public void T01_Register_ValidCommand_PassesValidation()
    {
        var command = new RegisterUserCommand(
            "newuser@test.com",
            "new_user",
            "Secret1!",
            "Secret1!");

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Register_PasswordMismatch_FailsValidation()
    {
        var command = new RegisterUserCommand(
            "newuser@test.com",
            "new_user",
            "Secret1!",
            "Other1!");

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.ConfirmPassword);
    }

    [Fact]
    public void Register_InvalidEmail_FailsValidation()
    {
        var command = new RegisterUserCommand(
            "not-an-email",
            "new_user",
            "Secret1!",
            "Secret1!");

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Email);
    }
}
