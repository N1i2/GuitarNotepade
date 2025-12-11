using Domain.Interfaces;
using Domain.Interfaces.Repositories;
using Infrastructure.Repositories;

namespace Infrastructure.Data;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;

        Users = new UserRepository(context);
        Chords = new ChordRepository(context);
        //Songs = new SongRepository(context);
        //Albums = new AlbumRepository(context);
        //StrummingPatterns = new StrummingPatternRepository(context);
        //SongLines = new SongLineRepository(context);
        //SongChords = new SongChordRepository(context);
        //UserFavoriteSongs = new UserFavoriteSongRepository(context);
        //AlbumSongs = new AlbumSongRepository(context);
        //SongReviews = new SongReviewRepository(context);
        //SongAudioRecordings = new SongAudioRecordingRepository(context);
        //SongRelations = new SongRelationRepository(context);
        //SongGenres = new SongGenreRepository(context);
        //SongThemes = new SongThemeRepository(context);
        //SongStrummingPatterns = new SongStrummingPatternRepository(context);
        //Genres = new GenreRepository(context);
        //Themes = new ThemeRepository(context);
    }

    public IUserRepository Users { get; }
    public IChordRepository Chords { get; }
    //public ISongRepository Songs { get; }
    //public IAlbumRepository Albums { get; }
    //public IStrummingPatternRepository StrummingPatterns { get; }
    //public ISongLineRepository SongLines { get; }
    //public ISongChordRepository SongChords { get; }
    //public IUserFavoriteSongRepository UserFavoriteSongs { get; }
    //public IAlbumSongRepository AlbumSongs { get; }
    //public ISongReviewRepository SongReviews { get; }
    //public ISongAudioRecordingRepository SongAudioRecordings { get; }
    //public ISongRelationRepository SongRelations { get; }
    //public ISongGenreRepository SongGenres { get; }
    //public ISongThemeRepository SongThemes { get; }
    //public ISongStrummingPatternRepository SongStrummingPatterns { get; }
    //public IGenreRepository Genres { get; }
    //public IThemeRepository Themes { get; }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}