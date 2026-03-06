using Microsoft.EntityFrameworkCore;
using Domain.Entities;
using System.Reflection;

namespace Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Song> Songs { get; set; }
        public DbSet<Chord> Chords { get; set; }
        public DbSet<StrummingPattern> StrummingPatterns { get; set; }
        public DbSet<SongReview> SongReviews { get; set; }
        public DbSet<SongSegment> SongSegments { get; set; }
        public DbSet<SongSegmentPosition> SongSegmentPositions { get; set; }
        public DbSet<SongStructure> SongStructures { get; set; }
        public DbSet<SongPattern> SongPatterns { get; set; }
        public DbSet<SongComment> SongComments { get; set; }
        public DbSet<SongChord> SongChords { get; set; }
        public DbSet<Album> Albums { get; set; }
        public DbSet<SongAlbum> SongAlbums { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Email)
                    .IsRequired()
                    .HasMaxLength(256);

                entity.Property(e => e.NikName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.PasswordHash)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(e => e.Role)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.AvatarUrl)
                    .HasMaxLength(1000);

                entity.Property(e => e.Bio)
                    .HasMaxLength(1000);

                entity.Property(e => e.BlockReason)
                    .HasMaxLength(500);

                entity.Property(e => e.CreateAt)
                    .IsRequired();

                entity.HasMany(e => e.Songs)
                    .WithOne(e => e.Owner)
                    .HasForeignKey(e => e.OwnerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.Chords)
                    .WithOne(e => e.CreatedBy)
                    .HasForeignKey(e => e.CreatedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.StrummingPatterns)
                    .WithOne(e => e.CreatedBy)
                    .HasForeignKey(e => e.CreatedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.Reviews)
                    .WithOne(e => e.User)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.Comments)
                    .WithOne(e => e.User)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Song>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(e => e.Artist)
                    .HasMaxLength(200);

                entity.Property(e => e.Description)
                    .HasMaxLength(2000);

                entity.Property(e => e.Genre)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Theme)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.CustomAudioUrl)
                    .HasMaxLength(1000);

                entity.Property(e => e.CustomAudioType)
                    .HasMaxLength(50);

                entity.Property(e => e.FullText)
                    .IsRequired();

                entity.Property(e => e.CreatedAt)
                    .IsRequired();

                entity.Property(e => e.UpdatedAt);

                entity.Property(e => e.ReviewCount)
                    .IsRequired()
                    .HasDefaultValue(0);

                entity.Property(e => e.AverageBeautifulRating)
                    .HasColumnType("decimal(3,2)");

                entity.Property(e => e.AverageDifficultyRating)
                    .HasColumnType("decimal(3,2)");

                entity.HasOne(e => e.ParentSong)
                    .WithMany(e => e.ChildSongs)
                    .HasForeignKey(e => e.ParentSongId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Structure)
                    .WithOne(e => e.Song)
                    .HasForeignKey<SongStructure>(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.Comments)
                    .WithOne(e => e.Song)
                    .HasForeignKey(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.Reviews)
                    .WithOne(e => e.Song)
                    .HasForeignKey(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.SongChords)
                    .WithOne(e => e.Song)
                    .HasForeignKey(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.SongPatterns)
                    .WithOne(e => e.Song)
                    .HasForeignKey(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.ChildSongs)
                    .WithOne(e => e.ParentSong)
                    .HasForeignKey(e => e.ParentSongId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.OwnerId);
                entity.HasIndex(e => e.ParentSongId);
                entity.HasIndex(e => e.IsPublic);
                entity.HasIndex(e => e.Title);
                entity.HasIndex(e => e.Genre);
                entity.HasIndex(e => e.Theme);
                entity.HasIndex(e => e.CreatedAt);
            });

            modelBuilder.Entity<Chord>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.Fingering)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Description)
                    .HasMaxLength(500);

                entity.Property(e => e.CreatedAt)
                    .IsRequired();

                entity.Property(e => e.UpdatedAt);

                entity.HasOne(e => e.CreatedBy)
                    .WithMany(e => e.Chords)
                    .HasForeignKey(e => e.CreatedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.SongChords)
                    .WithOne(e => e.Chord)
                    .HasForeignKey(e => e.ChordId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.CreatedByUserId);
                entity.HasIndex(e => e.Name);
            });

            modelBuilder.Entity<StrummingPattern>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Pattern)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(e => e.Description)
                    .HasMaxLength(1000);

                entity.Property(e => e.IsFingerStyle)
                    .IsRequired()
                    .HasDefaultValue(false);

                entity.Property(e => e.CreatedAt)
                    .IsRequired();

                entity.Property(e => e.UpdatedAt);

                entity.HasOne(e => e.CreatedBy)
                    .WithMany(e => e.StrummingPatterns)
                    .HasForeignKey(e => e.CreatedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.SongPatterns)
                    .WithOne(e => e.StrummingPattern)
                    .HasForeignKey(e => e.StrummingPatternId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.CreatedByUserId);
                entity.HasIndex(e => e.Name);
                entity.HasIndex(e => e.IsFingerStyle);
            });

            modelBuilder.Entity<SongStructure>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.SongId)
                    .IsRequired();

                entity.HasOne(e => e.Song)
                    .WithOne(e => e.Structure)
                    .HasForeignKey<SongStructure>(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.SegmentPositions)
                    .WithOne(e => e.SongStructure)
                    .HasForeignKey(e => e.SongId)
                    .HasPrincipalKey(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.SongId)
                    .IsUnique();
            });

            modelBuilder.Entity<SongSegment>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Lyric)
                    .HasMaxLength(1000);

                entity.Property(e => e.Description)
                    .HasMaxLength(500);

                entity.Property(e => e.Color)
                    .HasMaxLength(50);

                entity.Property(e => e.BackgroundColor)
                    .HasMaxLength(50);

                entity.Property(e => e.ContentHash)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Type)
                    .IsRequired()
                    .HasConversion<string>()
                    .HasMaxLength(20);

                entity.Property(e => e.Duration);

                entity.HasOne(e => e.Chord)
                    .WithMany()
                    .HasForeignKey(e => e.ChordId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.Pattern)
                    .WithMany()
                    .HasForeignKey(e => e.PatternId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasMany(e => e.Positions)
                    .WithOne(e => e.Segment)
                    .HasForeignKey(e => e.SegmentId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.Comments)
                    .WithOne(e => e.Segment)
                    .HasForeignKey(e => e.SegmentId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.ContentHash);
                entity.HasIndex(e => e.Type);
                entity.HasIndex(e => e.ChordId);
                entity.HasIndex(e => e.PatternId);
            });

            modelBuilder.Entity<SongSegmentPosition>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.SongId)
                    .IsRequired();

                entity.Property(e => e.SegmentId)
                    .IsRequired();

                entity.Property(e => e.PositionIndex)
                    .IsRequired();

                entity.Property(e => e.RepeatGroup)
                    .HasMaxLength(100);

                entity.HasOne(e => e.Segment)
                    .WithMany(e => e.Positions)
                    .HasForeignKey(e => e.SegmentId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.SongStructure)
                    .WithMany(e => e.SegmentPositions)
                    .HasForeignKey(e => e.SongId)
                    .HasPrincipalKey(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Song)
                    .WithMany(e => e.SegmentPositions)
                    .HasForeignKey(e => e.SongId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => new { e.SongId, e.PositionIndex })
                    .IsUnique();

                entity.HasIndex(e => e.PositionIndex);
                entity.HasIndex(e => e.SegmentId);
                entity.HasIndex(e => e.RepeatGroup);
            });

            modelBuilder.Entity<SongReview>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.SongId)
                    .IsRequired();

                entity.Property(e => e.UserId)
                    .IsRequired();

                entity.Property(e => e.ReviewText)
                    .IsRequired()
                    .HasMaxLength(2000);

                entity.Property(e => e.BeautifulLevel)
                    .HasColumnType("int");

                entity.Property(e => e.DifficultyLevel)
                    .HasColumnType("int");

                entity.Property(e => e.CreatedAt)
                    .IsRequired();

                entity.Property(e => e.UpdatedAt);

                entity.HasOne(e => e.User)
                    .WithMany(e => e.Reviews)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Song)
                    .WithMany(e => e.Reviews)
                    .HasForeignKey(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => new { e.UserId, e.SongId })
                    .IsUnique();

                entity.HasIndex(e => e.SongId);
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.CreatedAt);
            });

            modelBuilder.Entity<SongPattern>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.SongId)
                    .IsRequired();

                entity.Property(e => e.StrummingPatternId)
                    .IsRequired();

                entity.HasIndex(e => new { e.SongId, e.StrummingPatternId })
                    .IsUnique();

                entity.HasOne(e => e.Song)
                    .WithMany(e => e.SongPatterns)
                    .HasForeignKey(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.StrummingPattern)
                    .WithMany(e => e.SongPatterns)
                    .HasForeignKey(e => e.StrummingPatternId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<SongChord>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.SongId)
                    .IsRequired();

                entity.Property(e => e.ChordId)
                    .IsRequired();

                entity.HasIndex(e => new { e.SongId, e.ChordId })
                    .IsUnique();

                entity.HasOne(e => e.Song)
                    .WithMany(e => e.SongChords)
                    .HasForeignKey(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Chord)
                    .WithMany(e => e.SongChords)
                    .HasForeignKey(e => e.ChordId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<SongComment>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.UserId)
                    .IsRequired();

                entity.Property(e => e.SongId)
                    .IsRequired();

                entity.Property(e => e.Text)
                    .IsRequired()
                    .HasMaxLength(1000);

                entity.Property(e => e.CreatedAt)
                    .IsRequired();

                entity.HasOne(e => e.User)
                    .WithMany(e => e.Comments)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Song)
                    .WithMany(e => e.Comments)
                    .HasForeignKey(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Segment)
                    .WithMany(e => e.Comments)
                    .HasForeignKey(e => e.SegmentId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.SongId);
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.SegmentId);
                entity.HasIndex(e => e.CreatedAt);
            });

            modelBuilder.Entity<Album>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(e => e.CoverUrl)
                    .HasMaxLength(1000);

                entity.Property(e => e.Description)
                    .HasMaxLength(2000);

                entity.Property(e => e.Genre)
                    .HasMaxLength(100);

                entity.Property(e => e.Theme)
                    .HasMaxLength(100);

                entity.Property(e => e.IsPublic)
                    .IsRequired()
                    .HasDefaultValue(false);

                entity.Property(e => e.CreatedAt)
                    .IsRequired();

                entity.Property(e => e.UpdatedAt);

                entity.HasOne(e => e.Owner)
                    .WithMany()
                    .HasForeignKey(e => e.OwnerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.SongAlbums)
                    .WithOne(e => e.Album)
                    .HasForeignKey(e => e.AlbumId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.OwnerId);
                entity.HasIndex(e => e.Title);
                entity.HasIndex(e => e.IsPublic);
                entity.HasIndex(e => e.Genre);
                entity.HasIndex(e => e.Theme);
                entity.HasIndex(e => e.CreatedAt);
            });

            modelBuilder.Entity<SongAlbum>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.AlbumId)
                    .IsRequired();

                entity.Property(e => e.SongId)
                    .IsRequired();

                entity.HasIndex(e => new { e.AlbumId, e.SongId })
                    .IsUnique();

                entity.HasOne(e => e.Album)
                    .WithMany(e => e.SongAlbums)
                    .HasForeignKey(e => e.AlbumId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Song)
                    .WithMany() 
                    .HasForeignKey(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.AlbumId);
                entity.HasIndex(e => e.SongId);
            });
        }
    }
}
