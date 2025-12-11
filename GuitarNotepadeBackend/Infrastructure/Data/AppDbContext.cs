using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Song> Songs => Set<Song>();
    public DbSet<Album> Albums => Set<Album>();
    public DbSet<Chord> Chords => Set<Chord>();
    public DbSet<StrummingPattern> StrummingPatterns => Set<StrummingPattern>();
    public DbSet<SongLine> SongLines => Set<SongLine>();
    public DbSet<SongChord> SongChords => Set<SongChord>();
    public DbSet<UserFavoriteSong> UserFavoriteSongs => Set<UserFavoriteSong>();
    public DbSet<AlbumSong> AlbumSongs => Set<AlbumSong>();
    public DbSet<SongReview> SongReviews => Set<SongReview>();
    public DbSet<SongAudioRecording> SongAudioRecordings => Set<SongAudioRecording>();
    public DbSet<SongRelation> SongRelations => Set<SongRelation>();
    public DbSet<SongGenre> SongGenres => Set<SongGenre>();
    public DbSet<SongTheme> SongThemes => Set<SongTheme>();
    public DbSet<SongStrummingPattern> SongStrummingPatterns => Set<SongStrummingPattern>();
    public DbSet<Genre> Genres => Set<Genre>();
    public DbSet<Theme> Themes => Set<Theme>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureUser(modelBuilder);
        ConfigureSong(modelBuilder);
        ConfigureAlbum(modelBuilder);
        ConfigureChord(modelBuilder);
        ConfigureStrummingPattern(modelBuilder);
        ConfigureSongLine(modelBuilder);
        ConfigureSongChord(modelBuilder);
        ConfigureUserFavoriteSong(modelBuilder);
        ConfigureAlbumSong(modelBuilder);
        ConfigureSongReview(modelBuilder);
        ConfigureSongAudioRecording(modelBuilder);
        ConfigureSongRelation(modelBuilder);
        ConfigureSongGenre(modelBuilder);
        ConfigureSongTheme(modelBuilder);
        ConfigureSongStrummingPattern(modelBuilder);
        ConfigureGenre(modelBuilder);
        ConfigureTheme(modelBuilder);
    }

    private static void ConfigureUser(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.NikName).IsUnique();
            entity.HasIndex(u => u.BlockedUntil); 

            entity.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(255);
            entity.Property(u => u.NikName)
                .IsRequired()
                .HasMaxLength(100);
            entity.Property(u => u.PasswordHash)
                .IsRequired();
            entity.Property(u => u.Role)
                .IsRequired()
                .HasMaxLength(20);
            entity.Property(u => u.AvatarUrl)
                .IsRequired(false);
            entity.Property(u => u.Bio)
                .IsRequired(false);
            entity.Property(u => u.BlockedUntil)
                .IsRequired(false);
            entity.Property(u => u.BlockReason)
                .IsRequired(false)
                .HasMaxLength(500); 
            entity.Property(u => u.CreateAt)
                .IsRequired();
        });
    }

    private static void ConfigureChord(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Chord>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.HasIndex(c => c.Name);
            entity.HasIndex(c => c.Fingering);
            entity.HasIndex(c => new { c.Name, c.Fingering }).IsUnique();

            entity.Property(c => c.Name)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(c => c.Fingering)
                .IsRequired()
                .HasMaxLength(17);

            entity.Property(c => c.Description)
                .IsRequired(false)
                .HasMaxLength(500);

            entity.Property(c => c.CreatedByUserId)
                .IsRequired();

            entity.Property(c => c.CreatedAt)
                .IsRequired();

            entity.Property(c => c.UpdatedAt)
                .IsRequired(false);

            entity.HasOne(c => c.CreatedBy)
                  .WithMany()
                  .HasForeignKey(c => c.CreatedByUserId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureSong(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Song>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.HasIndex(s => s.OwnerId);
            entity.HasIndex(s => s.Title);
            entity.HasIndex(s => s.IsPublic);

            entity.Property(s => s.Title)
                .IsRequired()
                .HasMaxLength(200);
            entity.Property(s => s.Lyrics)
                .IsRequired();
            entity.Property(s => s.OriginalArtist)
                .IsRequired(false)
                .HasMaxLength(200);
            entity.Property(s => s.DifficultyLevel)
                .IsRequired();
            entity.Property(s => s.IsPublic)
                .IsRequired();
            entity.Property(s => s.CreatedAt)
                .IsRequired();
            entity.Property(s => s.UpdatedAt)
                .IsRequired();

            entity.HasOne(s => s.Owner)
                  .WithMany(u => u.Songs)
                  .HasForeignKey(s => s.OwnerId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureAlbum(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Album>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.HasIndex(a => a.OwnerId);
            entity.HasIndex(a => a.Title);

            entity.Property(a => a.Title)
                .IsRequired()
                .HasMaxLength(200);
            entity.Property(a => a.Description)
                .IsRequired(false);
            entity.Property(a => a.CoverImageUri)
                .IsRequired(false);
            entity.Property(a => a.IsPublic)
                .IsRequired();
            entity.Property(a => a.CreatedAt)
                .IsRequired();
            entity.Property(a => a.UpdatedAt)
                .IsRequired();

            entity.HasOne(a => a.Owner)
                  .WithMany(u => u.Albums)
                  .HasForeignKey(a => a.OwnerId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureStrummingPattern(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<StrummingPattern>(entity =>
        {
            entity.HasKey(sp => sp.Id);
            entity.HasIndex(sp => sp.Name);
            entity.HasIndex(sp => sp.PatternType);

            entity.Property(sp => sp.Name)
                .IsRequired()
                .HasMaxLength(100);
            entity.Property(sp => sp.Pattern)
                .IsRequired();
            entity.Property(sp => sp.DiagramImageUrl)
                .IsRequired(false);
            entity.Property(sp => sp.PatternType)
                .IsRequired()
                .HasMaxLength(20);
        });
    }

    private static void ConfigureSongLine(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SongLine>(entity =>
        {
            entity.HasKey(sl => sl.Id);
            entity.HasIndex(sl => sl.SongId);
            entity.HasIndex(sl => new { sl.SongId, sl.LineNumber });

            entity.Property(sl => sl.LineText)
                .IsRequired();
            entity.Property(sl => sl.LineNumber)
                .IsRequired();
            entity.Property(sl => sl.SortOrder)
                .IsRequired();

            entity.HasOne(sl => sl.Song)
                  .WithMany(s => s.SongLines)
                  .HasForeignKey(sl => sl.SongId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sl => sl.StrummingPattern)
                  .WithMany(sp => sp.SongLines)
                  .HasForeignKey(sl => sl.StrummingPatternId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }

    private static void ConfigureSongChord(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SongChord>(entity =>
        {
            entity.HasKey(sc => sc.Id);
            entity.HasIndex(sc => sc.SongLineId);
            entity.HasIndex(sc => new { sc.SongLineId, sc.PositionInLine });

            entity.Property(sc => sc.PositionInLine)
                .IsRequired();
            entity.Property(sc => sc.ChordVariation)
                .IsRequired(false)
                .HasMaxLength(50);

            entity.HasOne(sc => sc.SongLine)
                  .WithMany(sl => sl.Chords)
                  .HasForeignKey(sc => sc.SongLineId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sc => sc.Chord)
                  .WithMany(c => c.SongChords)
                  .HasForeignKey(sc => sc.ChordId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureUserFavoriteSong(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserFavoriteSong>(entity =>
        {
            entity.HasKey(uf => uf.Id);
            entity.HasIndex(uf => new { uf.UserId, uf.SongId }).IsUnique();
            entity.HasIndex(uf => uf.UserId);

            entity.Property(uf => uf.AddedAt)
                .IsRequired();

            entity.HasOne(uf => uf.User)
                  .WithMany(u => u.FavoriteSongs)
                  .HasForeignKey(uf => uf.UserId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(uf => uf.Song)
                  .WithMany(s => s.FavoriteByUsers)
                  .HasForeignKey(uf => uf.SongId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureAlbumSong(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AlbumSong>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.HasIndex(a => new { a.AlbumId, a.SongId }).IsUnique();
            entity.HasIndex(a => a.AlbumId);

            entity.Property(a => a.SortOrder)
                .IsRequired();
            entity.Property(a => a.AddedAt)
                .IsRequired();

            entity.HasOne(a => a.Album)
                  .WithMany(al => al.AlbumSongs)
                  .HasForeignKey(a => a.AlbumId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.Song)
                  .WithMany(s => s.AlbumSongs)
                  .HasForeignKey(a => a.SongId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.User)
                  .WithMany()
                  .HasForeignKey(a => a.UserId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureSongReview(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SongReview>(entity =>
        {
            entity.HasKey(sr => sr.Id);
            entity.HasIndex(sr => new { sr.SongId, sr.UserId }).IsUnique();
            entity.HasIndex(sr => sr.SongId);
            entity.HasIndex(sr => sr.UserId);

            entity.Property(sr => sr.Rating)
                .IsRequired();
            entity.Property(sr => sr.DifficultyRating)
                .IsRequired();
            entity.Property(sr => sr.ReviewText)
                .IsRequired();
            entity.Property(sr => sr.CreatedAt)
                .IsRequired();

            entity.HasOne(sr => sr.Song)
                  .WithMany(s => s.Reviews)
                  .HasForeignKey(sr => sr.SongId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sr => sr.User)
                  .WithMany(u => u.Reviews)
                  .HasForeignKey(sr => sr.UserId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureSongAudioRecording(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SongAudioRecording>(entity =>
        {
            entity.HasKey(sar => sar.Id);
            entity.HasIndex(sar => sar.SongId);
            entity.HasIndex(sar => sar.UserId);

            entity.Property(sar => sar.AudioFileUrl)
                .IsRequired();
            entity.Property(sar => sar.Title)
                .IsRequired();
            entity.Property(sar => sar.RecordedAt)
                .IsRequired();

            entity.HasOne(sar => sar.Song)
                  .WithMany(s => s.AudioRecordings)
                  .HasForeignKey(sar => sar.SongId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sar => sar.User)
                  .WithMany(u => u.AudioRecordings)
                  .HasForeignKey(sar => sar.UserId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureSongRelation(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SongRelation>(entity =>
        {
            entity.HasKey(sr => sr.Id);
            entity.HasIndex(sr => sr.OriginalSongId);
            entity.HasIndex(sr => sr.DerivedSongId).IsUnique();
            entity.HasIndex(sr => new { sr.OriginalSongId, sr.DerivedSongId });

            entity.Property(sr => sr.RelationType)
                .IsRequired()
                .HasMaxLength(20);
            entity.Property(sr => sr.CreatedAt)
                .IsRequired();

            entity.HasOne(sr => sr.OriginalSong)
                  .WithMany(s => s.DerivedSongs)
                  .HasForeignKey(sr => sr.OriginalSongId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(sr => sr.DerivedSong)
                  .WithMany(s => s.OriginalSongs)
                  .HasForeignKey(sr => sr.DerivedSongId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureSongGenre(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SongGenre>(entity =>
        {
            entity.HasKey(sg => sg.Id);
            entity.HasIndex(sg => new { sg.SongId, sg.GenreId }).IsUnique();
            entity.HasIndex(sg => sg.SongId);
            entity.HasIndex(sg => sg.GenreId);

            entity.HasOne(sg => sg.Song)
                  .WithMany(s => s.SongGenres)
                  .HasForeignKey(sg => sg.SongId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sg => sg.Genre)
                  .WithMany(g => g.SongGenres)
                  .HasForeignKey(sg => sg.GenreId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureSongTheme(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SongTheme>(entity =>
        {
            entity.HasKey(st => st.Id);
            entity.HasIndex(st => new { st.SongId, st.ThemeId }).IsUnique();
            entity.HasIndex(st => st.SongId);
            entity.HasIndex(st => st.ThemeId);

            entity.HasOne(st => st.Song)
                  .WithMany(s => s.SongThemes)
                  .HasForeignKey(st => st.SongId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(st => st.Theme)
                  .WithMany(t => t.SongThemes)
                  .HasForeignKey(st => st.ThemeId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureSongStrummingPattern(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SongStrummingPattern>(entity =>
        {
            entity.HasKey(ssp => ssp.Id);
            entity.HasIndex(ssp => new { ssp.SongId, ssp.StrummingPatternId }).IsUnique();
            entity.HasIndex(ssp => ssp.SongId);

            entity.Property(ssp => ssp.PatternDescription)
                .IsRequired(false);
            entity.Property(ssp => ssp.SortOrder)
                .IsRequired();

            entity.HasOne(ssp => ssp.Song)
                  .WithMany(s => s.SongStrummingPatterns)
                  .HasForeignKey(ssp => ssp.SongId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ssp => ssp.StrummingPattern)
                  .WithMany(sp => sp.SongStrummingPatterns)
                  .HasForeignKey(ssp => ssp.StrummingPatternId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureGenre(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Genre>(entity =>
        {
            entity.HasKey(g => g.Id);
            entity.HasIndex(g => g.Name).IsUnique();

            entity.Property(g => g.Name)
                .IsRequired()
                .HasMaxLength(50);
            entity.Property(g => g.Description)
                .IsRequired(false);
        });
    }

    private static void ConfigureTheme(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Theme>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.HasIndex(t => t.Name).IsUnique();

            entity.Property(t => t.Name)
                .IsRequired()
                .HasMaxLength(50);
            entity.Property(t => t.Description)
                .IsRequired(false);
        });
    }
}