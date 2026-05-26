using Application.Features.Commands.Users;
using Domain.Common;
using Domain.Interfaces;
using Domain.Interfaces.Repositories;
using Moq;
using UnitTests.Helpers;

namespace UnitTests.Handlers;

public class ToggleUserRoleCommandHandlerTests
{
    [Fact]
    public async Task T24_Handler_PromotesUserToAdmin()
    {
        var target = UserTestFactory.Create(email: "target@test.com");
        var adminId = Guid.NewGuid();

        var users = new Mock<IUserRepository>();
        users.Setup(r => r.GetByEmailAsync("target@test.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(target);

        var uow = new Mock<IUnitOfWork>();
        uow.Setup(u => u.Users).Returns(users.Object);
        uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var handler = new ToggleUserRoleCommandHandler(uow.Object);
        await handler.Handle(new ToggleUserRoleCommand("target@test.com", adminId), CancellationToken.None);

        Assert.Equal(Constants.Roles.Admin, target.Role);
    }
}
