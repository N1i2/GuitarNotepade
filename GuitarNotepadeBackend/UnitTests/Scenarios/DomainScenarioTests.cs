using Application.DTOs.Song;
using Application.Validations;
using Domain.Common;
using Domain.Entities;
using FluentValidation.TestHelper;
using UnitTests.Helpers;

namespace UnitTests.Scenarios;

public class DomainScenarioTests
{
    [Fact]
    public void T02_Song_CreatePublic_HasIsPublicTrue()
    {
        var ownerId = Guid.NewGuid();
        var song = Song.Create(ownerId, "Public Song", isPublic: true, genre: "Rock", theme: "Live");

        Assert.True(song.IsPublic);
        Assert.Equal(ownerId, song.OwnerId);
    }

    [Fact]
    public void T03_Chord_Create_StoresFingering()
    {
        var chord = Chord.Create("Am", "x-0-2-2-1-0", Guid.NewGuid(), "A minor");

        Assert.Equal("Am", chord.Name);
        Assert.Equal("x-0-2-2-1-0", chord.Fingering);
    }

    [Fact]
    public void T04_Pattern_Create_StoresPatternText()
    {
        var pattern = StrummingPattern.Create(
            "DownUp",
            "D D U U D U",
            isFingerStyle: false,
            Guid.NewGuid(),
            "Basic pattern");

        Assert.Equal("DownUp", pattern.Name);
        Assert.Contains("D D", pattern.Pattern);
    }

    [Fact]
    public void T05_SongSearchFilters_DefaultSort_IsCreatedAtDesc()
    {
        var filters = new SongSearchFilters();

        Assert.Equal("createdAt", filters.SortBy);
        Assert.Equal("desc", filters.SortOrder);
    }

    [Fact]
    public void T06_Song_OwnerId_MatchesCreator()
    {
        var ownerId = Guid.NewGuid();
        var song = Song.Create(ownerId, "My Song", isPublic: false, genre: "Pop", theme: "Theme");

        Assert.Equal(ownerId, song.OwnerId);
    }

    [Fact]
    public void T07_Pattern_CreatedByUserId_MatchesOwner()
    {
        var ownerId = Guid.NewGuid();
        var pattern = StrummingPattern.Create("P1", "D U", false, ownerId);

        Assert.Equal(ownerId, pattern.CreatedByUserId);
    }

    [Fact]
    public void T08_Chord_CreatedByUserId_MatchesOwner()
    {
        var ownerId = Guid.NewGuid();
        var chord = Chord.Create("C", "x-3-2-0-1-0", ownerId);

        Assert.Equal(ownerId, chord.CreatedByUserId);
    }

    [Fact]
    public void T09_Song_Private_IsNotPublic()
    {
        var song = Song.Create(Guid.NewGuid(), "Private", isPublic: false, genre: "Rock", theme: "Theme");

        Assert.False(song.IsPublic);
    }

    [Fact]
    public void T10_Album_Create_HasOwnerAndTitle()
    {
        var ownerId = Guid.NewGuid();
        var album = Album.Create(ownerId, "My Album", isPublic: true, genre: "Rock", theme: "Gig");

        Assert.Equal("My Album", album.Title);
        Assert.Equal(ownerId, album.OwnerId);
    }

    [Fact]
    public void T15_Chord_Update_ChangesFingering()
    {
        var chord = Chord.Create("G", "x-3-2-0-1-0", Guid.NewGuid());
        chord.Update("G", "x-3-2-0-1-3", "Updated");

        Assert.Equal("x-3-2-0-1-3", chord.Fingering);
    }

    [Fact]
    public void T16_Pattern_Update_ChangesPatternValue()
    {
        var pattern = StrummingPattern.Create("S1", "D U", false, Guid.NewGuid());
        pattern.Update("S1", "D D U", false, "Updated");

        Assert.Equal("D D U", pattern.Pattern);
    }

    [Fact]
    public void T17_CreateSongCommandValidator_EmptyTitle_Fails()
    {
        var validator = new CreateSongCommandValidator();
        var command = new Application.Features.Commands.Songs.CreateSongCommand(
            Guid.NewGuid(),
            "",
            "Rock",
            "Theme",
            null,
            null,
            null,
            null,
            true,
            null);

        var result = validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Title);
    }

    [Fact]
    public void T18_Song_Update_SetsCustomAudioFields()
    {
        var song = Song.Create(Guid.NewGuid(), "Audio Song", true, "Rock", "Theme");
        song.Update(customAudioUrl: "audio/track.mp3", customAudioType: "audio/mpeg");

        Assert.Equal("audio/track.mp3", song.CustomAudioUrl);
        Assert.Equal("audio/mpeg", song.CustomAudioType);
    }

    [Fact]
    public void T20_User_DefaultRole_IsUser()
    {
        var user = UserTestFactory.Create();

        Assert.Equal(Constants.Roles.User, user.Role);
        Assert.False(user.IsAdmin);
    }

    [Fact]
    public void T22_FreeUser_CannotCreateAlbum()
    {
        var user = UserTestFactory.Create();

        Assert.False(user.CanCreateAlbum());
    }

    [Fact]
    public void T23_User_MakeAdmin_SetsAdminRole()
    {
        var user = UserTestFactory.Create();
        user.MakeAdminRole();

        Assert.True(user.IsAdmin);
        Assert.Equal(Constants.Roles.Admin, user.Role);
    }

    [Fact]
    public void T26_Admin_HasUnrestrictedCreationQuota()
    {
        var admin = UserTestFactory.Create(role: Constants.Roles.Admin);

        Assert.True(admin.IsAdmin);
        Assert.True(admin.CanCreateMoreSongs(1000));
    }
}
