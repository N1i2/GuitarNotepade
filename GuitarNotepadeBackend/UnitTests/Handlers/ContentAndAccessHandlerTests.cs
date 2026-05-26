using Application.Features.Commands.Alboms;
using Application.Features.Commands.Songs;
using AutoMapper;
using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Repositories;
using Domain.Interfaces.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using UnitTests.Helpers;

namespace UnitTests.Handlers;

public class ContentAndAccessHandlerTests
{
    [Fact]
    public async Task T11_AddSongToFavorite_AddsSongToFavoriteAlbum()
    {
        var userId = Guid.NewGuid();
        var songId = Guid.NewGuid();
        var song = Song.Create(userId, "Favorite Song", true, "Rock", "Theme");

        var songs = new Mock<ISongRepository>();
        songs.Setup(r => r.GetByIdAsync(songId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(song);

        var alboms = new Mock<IAlbomRepository>();
        alboms.Setup(r => r.GetFavoriteAlbumByOwnerAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Album?)null);
        alboms.Setup(r => r.CreateAsync(It.IsAny<Album>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Album a, CancellationToken _) => a);

        var songAlboms = new Mock<ISongAlbomRepository>();
        songAlboms.Setup(r => r.GetByAlbumAndSongAsync(It.IsAny<Guid>(), songId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((SongAlbum?)null);

        var uow = new Mock<IUnitOfWork>();
        uow.Setup(u => u.Songs).Returns(songs.Object);
        uow.Setup(u => u.Alboms).Returns(alboms.Object);
        uow.Setup(u => u.SongAlboms).Returns(songAlboms.Object);
        uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var handler = new AddSongToFavoriteCommandHandler(
            uow.Object,
            NullLogger<AddSongToFavoriteCommandHandler>.Instance);

        var result = await handler.Handle(
            new AddSongToFavoriteCommand(userId, songId),
            CancellationToken.None);

        Assert.True(result);
        songAlboms.Verify(
            r => r.AddAsync(It.IsAny<SongAlbum>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task T13_CreateSong_ThrowsWhenFreeQuotaExceeded()
    {
        var user = UserTestFactory.Create();

        var users = new Mock<IUserRepository>();
        users.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var songs = new Mock<ISongRepository>();
        songs.Setup(r => r.CountByUserIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Constants.Limits.FreeUserMaxSongs);

        var uow = new Mock<IUnitOfWork>();
        uow.Setup(u => u.Users).Returns(users.Object);
        uow.Setup(u => u.Songs).Returns(songs.Object);

        var handler = new CreateSongCommandHandler(
            uow.Object,
            Mock.Of<ISongService>(),
            Mock.Of<IWebDavService>(),
            Mock.Of<IMapper>(),
            NullLogger<CreateSongCommandHandler>.Instance);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(
                new CreateSongCommand(
                    user.Id,
                    "Overflow",
                    "Rock",
                    "Theme",
                    null,
                    null,
                    null,
                    null,
                    true,
                    null,
                    null,
                    null),
                CancellationToken.None));
    }

    [Fact]
    public async Task T27_DeleteSong_NonOwnerNonAdmin_ThrowsUnauthorized()
    {
        var ownerId = Guid.NewGuid();
        var otherUser = UserTestFactory.Create();
        var song = Song.Create(ownerId, "Foreign", true, "Rock", "Theme");

        var songs = new Mock<ISongRepository>();
        songs.Setup(r => r.GetByIdAsync(song.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(song);

        var uow = new Mock<IUnitOfWork>();
        uow.Setup(u => u.Songs).Returns(songs.Object);

        var handler = new DeleteSongCommandHandler(
            uow.Object,
            Mock.Of<ISongDeletionService>(),
            NullLogger<DeleteSongCommandHandler>.Instance);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(
                new DeleteSongCommand(song.Id, otherUser.Id, Constants.Roles.User),
                CancellationToken.None));
    }
}
