using Application.Features.Commands.Payments;
using Domain.Interfaces.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using UnitTests.Helpers;

namespace UnitTests.Handlers;

public class UpgradeToPremiumCommandHandlerTests
{
    [Fact]
    public async Task T19_Handler_UpgradesUserToPremium()
    {
        var user = UserTestFactory.Create();
        var userId = Guid.NewGuid();

        var userService = new Mock<IUserService>();
        userService.Setup(s => s.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        userService.Setup(s => s.UpgradeToPremiumAsync(userId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask)
            .Callback(() => user.MakePremium());

        var handler = new UpgradeToPremiumCommandHandler(
            userService.Object,
            NullLogger<UpgradeToPremiumCommandHandler>.Instance);

        var result = await handler.Handle(
            new UpgradeToPremiumCommand(userId, "card", "token"),
            CancellationToken.None);

        Assert.True(result.Success);
        Assert.True(user.HasPremium);
    }
}
