using Domain.Interfaces.Repositories;

namespace Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    //ISongRepository Songs { get; }
    //IAlbumRepository Albums { get; }
    //IChordRepository Chords { get; }
    //IStrummingPatternRepository StrummingPatterns { get; }
    //ISongLineRepository SongLines { get; }
    //ISongChordRepository SongChords { get; }
    //IUserFavoriteSongRepository UserFavoriteSongs { get; }
    //IAlbumSongRepository AlbumSongs { get; }
    //ISongReviewRepository SongReviews { get; }
    //ISongAudioRecordingRepository SongAudioRecordings { get; }
    //ISongRelationRepository SongRelations { get; }
    //ISongGenreRepository SongGenres { get; }
    //ISongThemeRepository SongThemes { get; }
    //ISongStrummingPatternRepository SongStrummingPatterns { get; }
    //IGenreRepository Genres { get; }
    //IThemeRepository Themes { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}